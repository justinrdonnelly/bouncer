/* networkState.js
 *
 * Copyright 2024 Justin Donnelly
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * SPDX-License-Identifier: MPL-2.0
 */

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

import { NetworkManagerConnectionActiveProxy } from './networkManagerDbusInterfaces/networkManagerConnectionActiveProxy.js';
import { NetworkManagerDeviceProxy } from './networkManagerDbusInterfaces/networkManagerDeviceProxy.js';
import { NetworkManagerProxy } from './networkManagerDbusInterfaces/networkManagerProxy.js';

export class NetworkState {
    #networkManager;

    constructor(connectionChangedAction) {
        // Keep a reference to NetworkManager instance to prevent GC
        this.#networkManager = new NetworkManager('/org/freedesktop/NetworkManager', connectionChangedAction);
    }

    destroy() {
        this.#networkManager.destroy();
        this.#networkManager = null;
    }
}

/**
 * We model the state of NetworkManager using a tree. Each level in the tree corresponds to a dbus call (handled via a
 * GJS dbus proxy object). The root of the tree corresponds to the whole of NetworkManager. The properties include a
 * list of `Devices` object paths. Those devices make up the 2nd level of the tree. Device properties include an
 * `ActiveConnection` object path. The `ActiveConnection` is the 3rd level of the tree, and contains the `Id`. This is
 * the connection name, in which we are interested.
 */

// An abstract class to hold a dbus proxy object. We will make multiple dbus calls based on the results of earlier calls, building a hierarchy.
class NetworkManagerStateItem {
    // conceptually, the variables below are 'protected'
    static _wellKnownName  = 'org.freedesktop.NetworkManager';
    static _propertiesChanged = 'g-properties-changed';

    // conceptually, the variables below are 'protected'
    _objectPath;
    _connectionChangedAction;
    _proxyObj = null;
    _childNetworkManagerStateItems = new Map(); // map of object path to object for each related child NetworkManagerStateItem
    _handlerId;
    _proxyObjHandlerId;

    constructor(objectPath, connectionChangedAction) {
        if (this.constructor === NetworkManagerStateItem)
            throw new Error('NetworkManagerStateItem is an abstract class. Do not instantiate.');
        this._objectPath = objectPath;
        this._connectionChangedAction = connectionChangedAction;
        console.debug(`debug 1 - Instantiating ${this.constructor.name} with object path: ${this._objectPath}`);
    }

    destroy() {
        console.debug(`debug 1 - Destroying ${this.constructor.name} with object path: ${this._objectPath}`);
        // disconnect any proxy signals
        // Use optional chaining to confirm existence since we don't always keep the proxy
        this._proxyObj?.disconnect(this._proxyObjHandlerId);
        this._proxyObj = null;
        // handle children
        Array.from(this._childNetworkManagerStateItems.values()).forEach(child => {
            // call destroy on children
            child.destroy();
        });
    }

}


class NetworkManager extends NetworkManagerStateItem {
    #busWatchId;

    constructor(objectPath, connectionChangedAction) {
        // example objectPath: /org/freedesktop/NetworkManager (this is always what it is)
        super(objectPath, connectionChangedAction);
        this.#busWatchId = Gio.bus_watch_name(
            Gio.BusType.SYSTEM,
            NetworkManagerStateItem._wellKnownName,
            Gio.BusNameWatcherFlags.NONE,
            () => this.#getDbusProxyObject(),
            // When NetworkManager is no longer on dbus (eg, it has shut down), clean up all the child elements. This
            // functionality is all in `super.destroy`. DO NOT CALL `this.destroy` because we want to continue watching
            // the bus.
            () => super.destroy()
        );
    }

    destroy() {
        this.unwatchBus();
        super.destroy();
    }

    get networkDevices() {
        return Array.from(this._childNetworkManagerStateItems.values()).filter(device => device.isWifiDevice);
    }

    unwatchBus() {
        Gio.bus_unwatch_name(this.#busWatchId);
    }

    /**
     * We don't use async/await for 2 main reasons:
     * 1. It doesn't really buy anything in terms of readability.
     * 2. We end up binding to 'g-properties-changed' **before** the callback, which results in a flood of useless
     * notifications about the proxy being updated when it is first returned. We could work around this by storing
     * networkManagerProxy as a property, but... see point #1.
     */
    #getDbusProxyObject() {
        const networkManagerProxy = NetworkManagerProxy(
            Gio.DBus.system,
            NetworkManagerStateItem._wellKnownName,
            this._objectPath,
            (proxy, error) => {
                if (error !== null) {
                    if (error instanceof Gio.DBusError)
                        Gio.DBusError.strip_remote_error(error);

                    console.error(error);
                    return;
                }
                this._proxyObj = proxy;
                this.#addDevices();
                // monitor for property changes
                this._proxyObjHandlerId = networkManagerProxy.connect(NetworkManagerStateItem._propertiesChanged, this.#proxyUpdated.bind(this));
            },
            null,
            Gio.DBusProxyFlags.NONE
        );
    }

    #proxyUpdated(proxy, changed, invalidated) {
        console.debug('debug 1 - Proxy updated - NetworkManager');
        // NetworkManager doesn't have any state of its own. Just see if there are new children to add, or old children to remove.
        // handle updated device list
        for (const [name, value] of Object.entries(changed.deepUnpack())) {
            console.debug('debug 3 - something changed - NetworkManager');
            console.debug(`debug 3 - name: ${name}`);
            console.debug(`debug 3 - value: ${value.recursiveUnpack()}`);
            if (name === 'Devices') {
                // Compare to previous list. Add/remove as necessary.
                const oldDeviceObjectPaths = Array.from(this._childNetworkManagerStateItems.keys());
                const newDeviceObjectPaths = value.recursiveUnpack();
                console.debug('debug 2 - Devices changed');
                console.debug(`debug 2 - New Devices: ${newDeviceObjectPaths}`);
                console.debug(`debug 2 - Old Devices: ${oldDeviceObjectPaths}`);
                const addedDeviceObjectPaths = newDeviceObjectPaths.filter(x => !oldDeviceObjectPaths.includes(x));
                const removedDeviceObjectPaths = oldDeviceObjectPaths.filter(x => !newDeviceObjectPaths.includes(x));
                console.debug(`debug 2 - devices to remove: ${removedDeviceObjectPaths}`);
                console.debug(`debug 2 - devices to add: ${addedDeviceObjectPaths}`);
                removedDeviceObjectPaths.forEach(d => {
                    console.debug(`debug 2 - Removing device ${d}`);
                    this.#removeDevice(d);
                });
                addedDeviceObjectPaths.forEach(d => {
                    console.debug(`debug 2 - Adding device ${d}`);
                    this.#addDevice(d);
                });
            }
        }

        // IIUC this means that I would need to make another async call to get the updated devices. A better
        // alternative would be to pass the GET_INVALIDATED_PROPERTIES flag during proxy construction. For now, this is
        // considered a fatal error. Log it, and destroy as much as you can.
        // see: https://gjs.guide/guides/gio/dbus.html#low-level-proxies
        for (const name of invalidated) {
            if (name === 'Devices') {
                console.error('Devices is invalidated. This is not supported.');
                this.destroy();
                return;
            }
        }
    }

    #addDevices() {
        const devices = this._proxyObj.Devices; // array of object paths
        console.debug(`debug 1 - Adding devices: ${devices}`); // e.g. /org/freedesktop/NetworkManager/Devices/1
        devices.forEach(d => this.#addDevice(d));
    }

    #addDevice(device) { // e.g. /org/freedesktop/NetworkManager/Devices/1
        this.#removeDevice(device); // if the device already exists, remove it
        console.debug(`debug 1 - Adding device: ${device}`); // e.g. /org/freedesktop/NetworkManager/Devices/1
        // Instantiate a new class that will make another dbus call
        const networkManagerDevice = new NetworkManagerDevice(device, this._connectionChangedAction);
        // Add to child devices
        this._childNetworkManagerStateItems.set(device, networkManagerDevice);
    }

    #removeDevice(deviceObjectPath) { // e.g. /org/freedesktop/NetworkManager/Devices/1
        // clean up old device if applicable
        console.debug(`debug 1 - Removing device: ${deviceObjectPath}`); // e.g. /org/freedesktop/NetworkManager/Devices/1
        const deviceObj = this._childNetworkManagerStateItems.get(deviceObjectPath);
        if (deviceObj) {
            this._childNetworkManagerStateItems.delete(deviceObjectPath);
            deviceObj.destroy();
        }
    }
}

class NetworkManagerDevice extends NetworkManagerStateItem {
    // from https://developer-old.gnome.org/NetworkManager/stable/nm-dbus-types.html#NMDeviceType
    static #NM_DEVICE_TYPE_WIFI = 2;
    #activeConnection;
    isWifiDevice = false;

    static #isConnectionActive(connectionValue) {
        return !(connectionValue === undefined || connectionValue === null || connectionValue === '/');
    }

    constructor(objectPath, connectionChangedAction) {
        // example objectPath: /org/freedesktop/NetworkManager/Devices/1
        super(objectPath, connectionChangedAction);
        this.#getDbusProxyObject();
    }

    // this is a map, but there should only ever be 1 entry
    get connection() {
        return Array.from(this._childNetworkManagerStateItems.values())[0];
    }

    /**
     * We don't use async/await for 2 main reasons:
     * 1. It doesn't really buy anything in terms of readability.
     * 2. We end up binding to 'g-properties-changed' **before** the callback, which results in a flood of useless
     * notifications about the proxy being updated when it is first returned. We could work around this by storing
     * networkManagerProxy as a property, but... see point #1.
     */
    #getDbusProxyObject() {
        const networkManagerDeviceProxy = NetworkManagerDeviceProxy(
            Gio.DBus.system,
            NetworkManagerStateItem._wellKnownName,
            this._objectPath,
            (proxy, error) => {
                if (error !== null) {
                    if (error instanceof Gio.DBusError)
                        Gio.DBusError.strip_remote_error(error);

                    console.error(error);
                    return;
                }
                // Use DeviceType to decide whether to continue. We will only track wireless devices. For wireless, the
                // device type is NM_DEVICE_TYPE_WIFI (2).
                if (proxy.DeviceType === NetworkManagerDevice.#NM_DEVICE_TYPE_WIFI) {
                    this.isWifiDevice = true;
                    this._proxyObj = proxy;
                    this.#addConnectionInfo();
                    // monitor for property changes
                    this._proxyObjHandlerId = networkManagerDeviceProxy.connect(NetworkManagerStateItem._propertiesChanged, this.#proxyUpdated.bind(this));
                }
            },
            null,
            Gio.DBusProxyFlags.NONE
        );
    }

    #proxyUpdated(proxy, changed, invalidated) {
        console.debug('debug 1 - Proxy updated - NetworkManagerDevice');
        // NetworkManagerDevice doesn't have any state of its own. Just see if there are new children to add, or old children to remove.

        // handle ActiveConnection
        for (const [name, valueVariant] of Object.entries(changed.deepUnpack())) {
            console.debug('debug 3 - something changed - NetworkManagerDevice');
            console.debug(`debug 3 - name: ${name}`);
            console.debug(`debug 3 - valueVariant: ${valueVariant.recursiveUnpack()}`);
            if (name === 'ActiveConnection') {
                // Compare to previous list. Add/remove as necessary.
                const value = valueVariant.deepUnpack();
                const oldValue = this.#activeConnection;
                console.debug(`debug 2 - NetworkManagerDevice - old ActiveConnection: ${oldValue}`);
                console.debug(`debug 2 - NetworkManagerDevice - new ActiveConnection: ${value}`);
                if (NetworkManagerDevice.#isConnectionActive(oldValue) && !NetworkManagerDevice.#isConnectionActive(value)) {
                    // connection has toggled from active to inactive
                    console.debug('debug 2 - connection toggled from active to inactive');
                    this.#deleteConnection(oldValue); // destroy old child
                    this.#addConnectionInfo(); // this will add the child ('/' in this case)
                    // Activate here because we won't have a child that can activate. It has been destroyed. Use empty string to indicate no connection.
                    this._connectionChangedAction.activate(GLib.Variant.new_array(new GLib.VariantType('s'), [GLib.Variant.new_string(''), GLib.Variant.new_string('')]));
                } else if (!NetworkManagerDevice.#isConnectionActive(oldValue) && NetworkManagerDevice.#isConnectionActive(value)) {
                    // connection has toggled from inactive to active
                    console.debug('debug 2 - connection toggled from inactive to active');
                    // The connection was inactive ('/'), so there was no child. Don't call #deleteConnection. This
                    // asymmetry is OK. The add above wouldn't actually put the connection into the child map. It would
                    // just set this.#activeConnection
                    this.#addConnectionInfo(); // this will add the child
                } else if (NetworkManagerDevice.#isConnectionActive(oldValue) && NetworkManagerDevice.#isConnectionActive(value)) {
                    // connection has changed from one active connection to another
                    // In my testing, this didn't actually happen. The connection was removed with 1 proxy update, then a new connection added with another.
                    console.debug(`debug 2 - connection changed from one active connection (${oldValue}) to another (${value})`);
                    this.#deleteConnection(oldValue); // destroy old child
                    this.#addConnectionInfo(); // this will add the child
                } else {
                    console.error(`ERROR: Unexpected transition for ActiveConnection (inactive to inactive). Old: ${oldValue}; New: ${value}`);
                    this.#addConnectionInfo(); // this will add the child
                }
            }
        }

        // IIUC this means that I would need to make another async call to get the updated devices. A better
        // alternative would be to pass the GET_INVALIDATED_PROPERTIES flag during proxy construction. For now, this is
        // considered a fatal error. Log it, and destroy as much as you can.
        // see: https://gjs.guide/guides/gio/dbus.html#low-level-proxies
        for (const name of invalidated) {
            if (name === 'ActiveConnection') {
                console.error('ActiveConnection is invalidated. This is not supported.');
                this.destroy();
                return;
            }
        }
    }

    #deleteConnection(activeConnection) { // delete the child connection
        console.debug(`debug 1 - Removing connection ${activeConnection}`);
        const child = this._childNetworkManagerStateItems.get(activeConnection);
        this._childNetworkManagerStateItems.delete(activeConnection);
        child.destroy();
    }

    #addConnectionInfo() {
        this.#activeConnection = this._proxyObj.ActiveConnection; // e.g. / (if not active), /org/freedesktop/NetworkManager/ActiveConnection/1 (if active)
        console.debug(`debug 1 - Adding connection ${this.#activeConnection}`);
        if (NetworkManagerDevice.#isConnectionActive(this.#activeConnection)) { // this connection is active, make another dbus call
            const networkManagerConnectionActive = new NetworkManagerConnectionActive(this.#activeConnection, this._connectionChangedAction);
            this._childNetworkManagerStateItems.set(this.#activeConnection, networkManagerConnectionActive);
        }
    }
}

class NetworkManagerConnectionActive extends NetworkManagerStateItem {
    constructor(objectPath, connectionChangedAction) {
        // example objectPath: /org/freedesktop/NetworkManager/ActiveConnection/1
        super(objectPath, connectionChangedAction);
        this.#getDbusProxyObject();
    }

    #activate() {
        this._connectionChangedAction.activate(GLib.Variant.new_array(new GLib.VariantType('s'), [GLib.Variant.new_string(this._proxyObj.Id), GLib.Variant.new_string(this._proxyObj.Connection)]));
    }

    /**
     * We don't use async/await for 2 main reasons:
     * 1. It doesn't really buy anything in terms of readability.
     * 2. We end up binding to 'g-properties-changed' **before** the callback, which results in a flood of useless
     * notifications about the proxy being updated when it is first returned. We could work around this by storing
     * networkManagerProxy as a property, but... see point #1.
     */
    #getDbusProxyObject() {
        const networkManagerConnectionActiveProxy = NetworkManagerConnectionActiveProxy(
            Gio.DBus.system,
            NetworkManagerStateItem._wellKnownName,
            this._objectPath,
            (sourceObj, error) => {
                if (error !== null) {
                    if (error instanceof Gio.DBusError)
                        Gio.DBusError.strip_remote_error(error);

                    console.error(error);
                    return;
                }
                this._proxyObj = sourceObj;
                console.log(`Wireless connection ID: ${this._proxyObj.Id}`); // e.g. Wired Connection 1
                console.log(`Settings object path: ${this._proxyObj.Connection}`); // e.g. /org/freedesktop/NetworkManager/Settings/5

                // monitor for changes
                this._proxyObjHandlerId = networkManagerConnectionActiveProxy.connect(NetworkManagerStateItem._propertiesChanged, this.#proxyUpdated.bind(this));
                this.#activate();
            },
            null,
            Gio.DBusProxyFlags.NONE
        );
    }

    #proxyUpdated(proxy, changed, invalidated) {
        console.debug('debug 1 - Proxy updated - NetworkManagerConnectionActive');
        // The only property I care about has a getter that accesses the proxy directly. No need to do anything here besides signal if necessary.
        // There are no children to worry about either.

        // check for which property was updated and only signal if we need to
        for (const [name, value] of Object.entries(changed.deepUnpack())) {
            console.debug('debug 3 - something changed - NetworkManagerConnectionActive');
            console.debug(`debug 3 - name: ${name}`);
            console.debug(`debug 3 - value: ${value.recursiveUnpack()}`);
            // Assume the Connection is never updated without the Id also being updated.
            if (name === 'Id') {
                console.debug(`debug 2 - ID updated to ${this._proxyObj.Id}`);
                // the ID has changed, signal and stop checking for other changes
                this.#activate();
                return;
            }
        }

        // IIUC this means that I would need to make another async call to get the updated devices. A better
        // alternative would be to pass the GET_INVALIDATED_PROPERTIES flag during proxy construction. For now, this is
        // considered a fatal error. Log it, and destroy as much as you can.
        // see: https://gjs.guide/guides/gio/dbus.html#low-level-proxies
        for (const name of invalidated) {
            if (name === 'Id') {
                console.error('Id is invalidated. This is not supported.');
                this.destroy();
                return;
            }
        }
    }
}
