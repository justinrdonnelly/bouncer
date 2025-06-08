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
import GObject from 'gi://GObject';

import { ErrorSignal } from './errorSignal.js';
import { NetworkManagerConnectionActiveProxy } from
    './networkManagerDbusInterfaces/networkManagerConnectionActiveProxy.js';
import { NetworkManagerDeviceProxy } from './networkManagerDbusInterfaces/networkManagerDeviceProxy.js';
import { NetworkManagerProxy } from './networkManagerDbusInterfaces/networkManagerProxy.js';

/*
 * We model the state of NetworkManager using a tree. Each level in the tree corresponds to a dbus call (handled via a
 * GJS dbus proxy object). The root of the tree corresponds to the whole of NetworkManager. The properties include a
 * list of `Devices` object paths. Those devices make up the 2nd level of the tree. Device properties include an
 * `ActiveConnection` object path. The `ActiveConnection` is the 3rd level of the tree, and contains the `Id`. This is
 * the connection name, in which we are interested.
 *
 * These classes (except for the abstract NetworkStateSignals and NetworkManagerStateItem) are ordered (as far as which
 * are used first) from bottom to top. We do this to keep the linter happy. We could disable linting on those lines, but
 * I prefer not to chance masking real errors. I trust that you can read from bottom to top.
 */

// An absttract class with all the signals we need.
const NetworkStateSignals = GObject.registerClass(
    {
        Signals: {
            'connection-changed': {
                param_types: [
                    GObject.TYPE_STRING, // connection ID
                    GObject.TYPE_STRING // settings object path (eg /org/freedesktop/NetworkManager/Settings/2)
                ],
            },
        },
    },
    class NetworkStateSignals extends ErrorSignal {
        emitConnectionChanged(connectionId, activeConnectionSettings) {
            super.emit('connection-changed', connectionId, activeConnectionSettings)
        }
    }
);

// An abstract class to hold a dbus proxy object. We will make multiple dbus calls based on the results of earlier
// calls, building a hierarchy.
const NetworkManagerStateItem = GObject.registerClass(
    class NetworkManagerStateItem extends NetworkStateSignals {
        // conceptually, the static variables below are 'protected'
        static _wellKnownName = 'org.freedesktop.NetworkManager';
        static _propertiesChanged = 'g-properties-changed';

        objectPath;

        // conceptually, the variables below are 'protected'
        _proxyObj = null;
        // map of object path to object for each related child NetworkManagerStateItem
        _childNetworkManagerStateItems = new Map();
        _handlerId;

        constructor(objectPath) {
            super();
            if (this.constructor === NetworkManagerStateItem)
                throw new Error('NetworkManagerStateItem is an abstract class. Do not instantiate.');
            this.objectPath = objectPath;
            console.debug(`debug 1 - Instantiating ${this.constructor.name} with object path: ${this.objectPath}`);
        }

        _addChild(objectPath, object) {
            this._childNetworkManagerStateItems.set(objectPath, object);
            this.#relaySignalErrors(object);
            this.#relaySignalConnectionChanged(object);
        }

        _destroyChild(objectPath) {
            const child = this._childNetworkManagerStateItems.get(objectPath);

            if (child) {
                this._childNetworkManagerStateItems.delete(objectPath);
                child.destroy();
            }
        }

        #relaySignalErrors(child) {
            // eslint-disable-next-line no-unused-vars
            child.connect('error', (emittingObject, fatal, id, title, message) => {
                console.debug('relaying error signal from deeper down in NetworkState.');
                this.emitError(fatal, id, title, message);
            });
        }

        #relaySignalConnectionChanged(child) {
            // eslint-disable-next-line no-unused-vars
            child.connect('connection-changed', (emittingObject, connectionId, activeConnectionSettings) => {
                console.debug('relaying connection-changed signal from deeper down in NetworkState.');
                this.emitConnectionChanged(connectionId, activeConnectionSettings);
            });
        }

        destroy() {
            console.debug(`debug 1 - Destroying ${this.constructor.name} with object path: ${this.objectPath}`);
            this._proxyObj = null;
            // handle children
            Array.from(this._childNetworkManagerStateItems.values()).forEach((child) => {
                this._destroyChild(child);
            });
        }

        _error() {
            this.emitError(
                true, // all errors here are considered fatal
                'network-state',
                _('Error determining network state'),
                _('Bouncer ran into an error determining network state. This is required for the application to work ' +
                    'correctly. Please see logs for more information.')
            );
        }
    }
);



const NetworkManagerConnectionActive = GObject.registerClass(
    class NetworkManagerConnectionActive extends NetworkManagerStateItem {
        constructor(objectPath) {
            // example objectPath: /org/freedesktop/NetworkManager/ActiveConnection/1
            super(objectPath);
            this.#getDbusProxyObject();
        }

        #connectionChanged() {
            this.emitConnectionChanged(this._proxyObj.Id, this._proxyObj.Connection);
        }

        /**
         * We don't use async/await for 2 main reasons:
         * 1. It doesn't really buy anything in terms of readability.
         * 2. We end up binding to 'g-properties-changed' **before** the callback, which results in a flood of useless
         * notifications about the proxy being updated when it is first returned. We could work around this by storing
         * networkManagerProxy as a property, but... see point #1.
         */
        #getDbusProxyObject() {
            NetworkManagerConnectionActiveProxy(
                Gio.DBus.system,
                NetworkManagerStateItem._wellKnownName,
                this.objectPath,
                (sourceObj, error) => {
                    if (error !== null) {
                        // error is [GLib.Error](https://docs.gtk.org/glib/struct.Error.html)
                        if (error instanceof Gio.DBusError)
                            Gio.DBusError.strip_remote_error(error);
                        console.error('Error getting NetworkManagerConnectionActive D-Bus proxy object.');
                        console.error(error.message);
                        this._error();
                        return;
                    }
                    this._proxyObj = sourceObj;
                    console.debug(`Wireless connection ID: ${this._proxyObj.Id}`); // e.g. Wired Connection 1
                    // e.g. /org/freedesktop/NetworkManager/Settings/5
                    console.debug(`Settings object path: ${this._proxyObj.Connection}`);

                    // monitor for changes
                    this._proxyObj.connect(NetworkManagerStateItem._propertiesChanged, this.#proxyUpdated.bind(this));
                    this.#connectionChanged();
                },
                null,
                Gio.DBusProxyFlags.NONE
            );
        }

        // eslint-disable-next-line no-unused-vars
        #proxyUpdated(proxy, changed, invalidated) {
            console.debug('debug 1 - Proxy updated - NetworkManagerConnectionActive');
            // The only property I care about has a getter that accesses the proxy directly. No need to do anything here
            // besides signal if necessary. There are no children to worry about either.

            // check for which property was updated and only signal if we need to
            for (const [name, value] of Object.entries(changed.deepUnpack())) {
                console.debug('debug 3 - something changed - NetworkManagerConnectionActive');
                console.debug(`debug 3 - name: ${name}`);
                console.debug(`debug 3 - value: ${value.recursiveUnpack()}`);
                // Assume the Connection is never updated without the Id also being updated.
                if (name === 'Id') {
                    console.debug(`debug 2 - ID updated to ${this._proxyObj.Id}`);
                    // the ID has changed, signal and stop checking for other changes
                    this.#connectionChanged();
                    return;
                }
            }

            // IIUC this means that I would need to make another async call to get the updated devices. A better
            // alternative would be to pass the GET_INVALIDATED_PROPERTIES flag during proxy construction. For now,
            // this is considered a fatal error. Log it, and destroy as much as you can.
            // see: https://gjs.guide/guides/gio/dbus.html#low-level-proxies
            for (const name of invalidated) {
                if (name === 'Id') {
                    console.error('Id is invalidated. This is not supported.');
                    this._error();
                    this.destroy();
                    return;
                }
            }
        }
    }
);

const NetworkManagerDevice = GObject.registerClass(
    class NetworkManagerDevice extends NetworkManagerStateItem {
        // from https://developer-old.gnome.org/NetworkManager/stable/nm-dbus-types.html#NMDeviceType
        static #NM_DEVICE_TYPE_WIFI = 2;
        #activeConnection;
        isWifiDevice = false;

        static #isConnectionActive(connectionValue) {
            return !(connectionValue === undefined || connectionValue === null || connectionValue === '/');
        }

        constructor(objectPath) {
            // example objectPath: /org/freedesktop/NetworkManager/Devices/1
            super(objectPath);
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
            NetworkManagerDeviceProxy(
                Gio.DBus.system,
                NetworkManagerStateItem._wellKnownName,
                this.objectPath,
                (proxy, error) => {
                    if (error !== null) {
                        // error is [GLib.Error](https://docs.gtk.org/glib/struct.Error.html)
                        if (error instanceof Gio.DBusError)
                            Gio.DBusError.strip_remote_error(error);
                        console.error('Error getting NetworkManagerDevice D-Bus proxy object.');
                        console.error(error.message);
                        this._error();
                        return;
                    }
                    // Use DeviceType to decide whether to continue. We will only track wireless devices. For wireless,
                    // the device type is NM_DEVICE_TYPE_WIFI (2).
                    if (proxy.DeviceType === NetworkManagerDevice.#NM_DEVICE_TYPE_WIFI) {
                        this.isWifiDevice = true;
                        this._proxyObj = proxy;
                        this.#addConnectionInfo();
                        // monitor for property changes
                        this._proxyObj.connect(NetworkManagerStateItem._propertiesChanged,
                            this.#proxyUpdated.bind(this));
                    }
                },
                null,
                Gio.DBusProxyFlags.NONE
            );
        }

        // eslint-disable-next-line no-unused-vars
        #proxyUpdated(proxy, changed, invalidated) {
            console.debug('debug 1 - Proxy updated - NetworkManagerDevice');
            // NetworkManagerDevice doesn't have any state of its own. Just see if there are new children to add, or old
            // children to remove.

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
                    if (NetworkManagerDevice.#isConnectionActive(oldValue) &&
                        !NetworkManagerDevice.#isConnectionActive(value)) {
                        // connection has toggled from active to inactive
                        console.debug('debug 2 - connection toggled from active to inactive');
                        this.#deleteConnection(oldValue); // destroy old child
                        this.#addConnectionInfo(); // this will add the child ('/' in this case)
                        // Emit here because we won't have a child that can emit. It has been destroyed. Use empty
                        // string to indicate no connection.
                        this.emitConnectionChanged('', '')
                    } else if (!NetworkManagerDevice.#isConnectionActive(oldValue) &&
                        NetworkManagerDevice.#isConnectionActive(value)) {
                        // connection has toggled from inactive to active
                        console.debug('debug 2 - connection toggled from inactive to active');
                        // The connection was inactive ('/'), so there was no child. Don't call #deleteConnection. This
                        // asymmetry is OK. The add above wouldn't actually put the connection into the child map. It
                        // would just set this.#activeConnection
                        this.#addConnectionInfo(); // this will add the child
                    } else if (NetworkManagerDevice.#isConnectionActive(oldValue) &&
                        NetworkManagerDevice.#isConnectionActive(value)) {
                        // connection has changed from one active connection to another
                        // In my testing, this didn't actually happen. The connection was removed with 1 proxy update,
                        // then a new connection added with another.
                        console.debug(`debug 2 - connection changed from one active connection (${oldValue}) to ` +
                            `another (${value})`);
                        this.#deleteConnection(oldValue); // destroy old child
                        this.#addConnectionInfo(); // this will add the child
                    } else {
                        console.error('Unexpected transition for ActiveConnection (inactive to inactive). Old: ' +
                            `${oldValue}; New: ${value}`);
                        // Although this is unexpected, it's not actually a big deal.
                        // As above, don't call #deleteConnection on an old inactive value.
                        this.#addConnectionInfo(); // this will add the child
                    }
                }
            }

            // IIUC this means that I would need to make another async call to get the updated devices. A better
            // alternative would be to pass the GET_INVALIDATED_PROPERTIES flag during proxy construction. For now, this
            // is considered a fatal error. Log it, and destroy as much as you can.
            // see: https://gjs.guide/guides/gio/dbus.html#low-level-proxies
            for (const name of invalidated) {
                if (name === 'ActiveConnection') {
                    console.error('ActiveConnection is invalidated. This is not supported.');
                    this._error();
                    this.destroy();
                    return;
                }
            }
        }

        #deleteConnection(activeConnection) {
            // delete the child connection
            console.debug(`debug 1 - Removing connection ${activeConnection}`);
            this._destroyChild(activeConnection);
        }

        #addConnectionInfo() {
            // e.g. / (if not active), /org/freedesktop/NetworkManager/ActiveConnection/1 (if active)
            this.#activeConnection = this._proxyObj.ActiveConnection;
            console.debug(`debug 1 - Adding connection ${this.#activeConnection}`);
            if (NetworkManagerDevice.#isConnectionActive(this.#activeConnection)) {
                // this connection is active, make another dbus call
                const networkManagerConnectionActive = new NetworkManagerConnectionActive(this.#activeConnection);
                this._addChild(this.#activeConnection, networkManagerConnectionActive);
            }
        }
    }
);

const NetworkManager = GObject.registerClass(
    class NetworkManager extends NetworkManagerStateItem {
        #busWatchId;

        constructor(objectPath) {
            // example objectPath: /org/freedesktop/NetworkManager (this is always what it is)
            super(objectPath);
            this.#busWatchId = Gio.bus_watch_name(
                Gio.BusType.SYSTEM,
                NetworkManagerStateItem._wellKnownName,
                Gio.BusNameWatcherFlags.NONE,
                () => this.#getDbusProxyObject(),
                // When NetworkManager is no longer on dbus (eg, it has shut down), clean up all the child elements.
                // This functionality is all in `super.destroy`. DO NOT CALL `this.destroy` because we want to continue
                // watching the bus.
                () => super.destroy()
            );
        }

        destroy() {
            this.#unwatchBus();
            super.destroy();
        }

        get networkDevices() {
            return Array.from(this._childNetworkManagerStateItems.values()).filter((device) => device.isWifiDevice);
        }

        #unwatchBus() {
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
            NetworkManagerProxy(
                Gio.DBus.system,
                NetworkManagerStateItem._wellKnownName,
                this.objectPath,
                (proxy, error) => {
                    if (error !== null) {
                        // error is [GLib.Error](https://docs.gtk.org/glib/struct.Error.html)
                        if (error instanceof Gio.DBusError)
                            Gio.DBusError.strip_remote_error(error);
                        console.error('Error getting NetworkManager D-Bus proxy object.');
                        console.error(error.message);
                        this._error();
                        return;
                    }
                    this._proxyObj = proxy;
                    this.#addDevices();
                    // monitor for property changes
                    this._proxyObj.connect(NetworkManagerStateItem._propertiesChanged, this.#proxyUpdated.bind(this));
                },
                null,
                Gio.DBusProxyFlags.NONE
            );
        }

        // eslint-disable-next-line no-unused-vars
        #proxyUpdated(proxy, changed, invalidated) {
            console.debug('debug 1 - Proxy updated - NetworkManager');
            // NetworkManager doesn't have any state of its own. Just see if there are new children to add, or old
            // children to remove.
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
                    const addedDeviceObjectPaths = newDeviceObjectPaths.filter(
                        (x) => !oldDeviceObjectPaths.includes(x)
                    );
                    const removedDeviceObjectPaths = oldDeviceObjectPaths.filter(
                        (x) => !newDeviceObjectPaths.includes(x)
                    );
                    console.debug(`debug 2 - devices to remove: ${removedDeviceObjectPaths}`);
                    console.debug(`debug 2 - devices to add: ${addedDeviceObjectPaths}`);
                    removedDeviceObjectPaths.forEach((d) => {
                        console.debug(`debug 2 - Removing device ${d}`);
                        this.#removeDevice(d);
                    });
                    addedDeviceObjectPaths.forEach((d) => {
                        console.debug(`debug 2 - Adding device ${d}`);
                        this.#addDevice(d);
                    });
                }
            }

            // IIUC this means that I would need to make another async call to get the updated devices. A better
            // alternative would be to pass the GET_INVALIDATED_PROPERTIES flag during proxy construction. For now, this
            // is considered a fatal error. Log it, and destroy as much as you can.
            // see: https://gjs.guide/guides/gio/dbus.html#low-level-proxies
            for (const name of invalidated) {
                if (name === 'Devices') {
                    console.error('Devices is invalidated. This is not supported.');
                    this._error();
                    this.destroy();
                    return;
                }
            }
        }

        #addDevices() {
            const devices = this._proxyObj.Devices; // array of object paths
            console.debug(`debug 1 - Adding devices: ${devices}`); // e.g. /org/freedesktop/NetworkManager/Devices/1
            devices.forEach((d) => this.#addDevice(d));
        }

        #addDevice(device) { // e.g. /org/freedesktop/NetworkManager/Devices/1
            this.#removeDevice(device); // if the device already exists, remove it
            console.debug(`debug 1 - Adding device: ${device}`); // e.g. /org/freedesktop/NetworkManager/Devices/1
            // Instantiate a new class that will make another dbus call
            const networkManagerDevice = new NetworkManagerDevice(device);
            // Add to child devices
            this._addChild(device, networkManagerDevice);
        }

        #removeDevice(deviceObjectPath) { // e.g. /org/freedesktop/NetworkManager/Devices/1
            // clean up old device if applicable
            // e.g. /org/freedesktop/NetworkManager/Devices/1
            console.debug(`debug 1 - Removing device: ${deviceObjectPath}`);
            this._destroyChild(deviceObjectPath);
        }
    }
);

export const NetworkState = GObject.registerClass(
    class NetworkState extends NetworkStateSignals {
        #networkManager;

        constructor() {
            super();
            // Keep a reference to NetworkManager instance to prevent GC
            this.#networkManager = new NetworkManager('/org/freedesktop/NetworkManager');
            // relay errors from this.#networkManager
            // eslint-disable-next-line no-unused-vars
            this.#networkManager.connect('error', (emittingObject, fatal, id, title, message) => {
                console.debug('relaying error signal from deeper down in NetworkState.');
                this.emitError(fatal, id, title, message);
            });
            // relay connection changes from this.#networkManager
            this.#networkManager.connect(
                // eslint-disable-next-line no-unused-vars
                'connection-changed', (emittingObject, connectionId, activeConnectionSettings) => {
                console.debug('relaying error signal from deeper down in NetworkState.');
                this.emitConnectionChanged(connectionId, activeConnectionSettings);
            });
        }

        destroy() {
            this.#networkManager.destroy();
            this.#networkManager = null;
        }
    }
);
