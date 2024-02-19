import Gio from 'gi://Gio';
import {NetworkManagerStateItemSuper} from './networkManagerStateItemSuperTest.js';

// TODO: how to sort imports?

// NOTE: You can ONLY HAVE ONE interface (the rest that were returned from the introspection were removed)
const networkManagerInterfaceXml = '\
    <node>\
        <interface name="org.freedesktop.NetworkManager">\
            <method name="Reload">\
                <arg type="u" name="flags" direction="in"/>\
            </method>\
            <method name="GetDevices">\
                <arg type="ao" name="devices" direction="out"/>\
            </method>\
            <method name="GetAllDevices">\
                <arg type="ao" name="devices" direction="out"/>\
            </method>\
            <method name="GetDeviceByIpIface">\
                <arg type="s" name="iface" direction="in"/>\
                <arg type="o" name="device" direction="out"/>\
            </method>\
            <method name="ActivateConnection">\
                <arg type="o" name="connection" direction="in"/>\
                <arg type="o" name="device" direction="in"/>\
                <arg type="o" name="specific_object" direction="in"/>\
                <arg type="o" name="active_connection" direction="out"/>\
            </method>\
            <method name="AddAndActivateConnection">\
                <arg type="a{sa{sv}}" name="connection" direction="in"/>\
                <arg type="o" name="device" direction="in"/>\
                <arg type="o" name="specific_object" direction="in"/>\
                <arg type="o" name="path" direction="out"/>\
                <arg type="o" name="active_connection" direction="out"/>\
            </method>\
            <method name="AddAndActivateConnection2">\
                <arg type="a{sa{sv}}" name="connection" direction="in"/>\
                <arg type="o" name="device" direction="in"/>\
                <arg type="o" name="specific_object" direction="in"/>\
                <arg type="a{sv}" name="options" direction="in"/>\
                <arg type="o" name="path" direction="out"/>\
                <arg type="o" name="active_connection" direction="out"/>\
                <arg type="a{sv}" name="result" direction="out"/>\
            </method>\
            <method name="DeactivateConnection">\
                <arg type="o" name="active_connection" direction="in"/>\
            </method>\
            <method name="Sleep">\
                <arg type="b" name="sleep" direction="in"/>\
            </method>\
            <method name="Enable">\
                <arg type="b" name="enable" direction="in"/>\
            </method>\
            <method name="GetPermissions">\
                <arg type="a{ss}" name="permissions" direction="out"/>\
            </method>\
            <method name="SetLogging">\
                <arg type="s" name="level" direction="in"/>\
                <arg type="s" name="domains" direction="in"/>\
            </method>\
            <method name="GetLogging">\
                <arg type="s" name="level" direction="out"/>\
                <arg type="s" name="domains" direction="out"/>\
            </method>\
            <method name="CheckConnectivity">\
                <arg type="u" name="connectivity" direction="out"/>\
            </method>\
            <method name="state">\
                <arg type="u" name="state" direction="out"/>\
            </method>\
            <method name="CheckpointCreate">\
                <arg type="ao" name="devices" direction="in"/>\
                <arg type="u" name="rollback_timeout" direction="in"/>\
                <arg type="u" name="flags" direction="in"/>\
                <arg type="o" name="checkpoint" direction="out"/>\
            </method>\
            <method name="CheckpointDestroy">\
                <arg type="o" name="checkpoint" direction="in"/>\
            </method>\
            <method name="CheckpointRollback">\
                <arg type="o" name="checkpoint" direction="in"/>\
                <arg type="a{su}" name="result" direction="out"/>\
            </method>\
            <method name="CheckpointAdjustRollbackTimeout">\
                <arg type="o" name="checkpoint" direction="in"/>\
                <arg type="u" name="add_timeout" direction="in"/>\
            </method>\
            <signal name="CheckPermissions"/>\
            <signal name="StateChanged">\
                <arg type="u" name="state"/>\
            </signal>\
            <signal name="DeviceAdded">\
                <arg type="o" name="device_path"/>\
            </signal>\
            <signal name="DeviceRemoved">\
                <arg type="o" name="device_path"/>\
            </signal>\
            <property type="ao" name="Devices" access="read"/>\
            <property type="ao" name="AllDevices" access="read"/>\
            <property type="ao" name="Checkpoints" access="read"/>\
            <property type="b" name="NetworkingEnabled" access="read"/>\
            <property type="b" name="WirelessEnabled" access="readwrite"/>\
            <property type="b" name="WirelessHardwareEnabled" access="read"/>\
            <property type="b" name="WwanEnabled" access="readwrite"/>\
            <property type="b" name="WwanHardwareEnabled" access="read"/>\
            <property type="b" name="WimaxEnabled" access="readwrite"/>\
            <property type="b" name="WimaxHardwareEnabled" access="read"/>\
            <property type="u" name="RadioFlags" access="read"/>\
            <property type="ao" name="ActiveConnections" access="read"/>\
            <property type="o" name="PrimaryConnection" access="read"/>\
            <property type="s" name="PrimaryConnectionType" access="read"/>\
            <property type="u" name="Metered" access="read"/>\
            <property type="o" name="ActivatingConnection" access="read"/>\
            <property type="b" name="Startup" access="read"/>\
            <property type="s" name="Version" access="read"/>\
            <property type="au" name="Capabilities" access="read"/>\
            <property type="u" name="State" access="read"/>\
            <property type="u" name="Connectivity" access="read"/>\
            <property type="b" name="ConnectivityCheckAvailable" access="read"/>\
            <property type="b" name="ConnectivityCheckEnabled" access="readwrite"/>\
            <property type="s" name="ConnectivityCheckUri" access="read"/>\
            <property type="a{sv}" name="GlobalDnsConfiguration" access="readwrite"/>\
        </interface>\
        <node name="IP4Config"/>\
        <node name="ActiveConnection"/>\
        <node name="AgentManager"/>\
        <node name="Devices"/>\
        <node name="DHCP4Config"/>\
        <node name="DnsManager"/>\
        <node name="IP6Config"/>\
        <node name="Settings"/>\
    </node>\
';
const NetworkManagerProxy = Gio.DBusProxy.makeProxyWrapper(networkManagerInterfaceXml);

const networkManagerDeviceInterfaceXml = '\
    <node>\
        <interface name="org.freedesktop.NetworkManager.Device">\
            <method name="Reapply">\
                <arg type="a{sa{sv}}" name="connection" direction="in"/>\
                <arg type="t" name="version_id" direction="in"/>\
                <arg type="u" name="flags" direction="in"/>\
            </method>\
            <method name="GetAppliedConnection">\
                <arg type="u" name="flags" direction="in"/>\
                <arg type="a{sa{sv}}" name="connection" direction="out"/>\
                <arg type="t" name="version_id" direction="out"/>\
            </method>\
            <method name="Disconnect"/>\
            <method name="Delete"/>\
            <signal name="StateChanged">\
                <arg type="u" name="new_state"/>\
                <arg type="u" name="old_state"/>\
                <arg type="u" name="reason"/>\
            </signal>\
            <property type="s" name="Udi" access="read"/>\
            <property type="s" name="Path" access="read"/>\
            <property type="s" name="Interface" access="read"/>\
            <property type="s" name="IpInterface" access="read"/>\
            <property type="s" name="Driver" access="read"/>\
            <property type="s" name="DriverVersion" access="read"/>\
            <property type="s" name="FirmwareVersion" access="read"/>\
            <property type="u" name="Capabilities" access="read"/>\
            <property type="u" name="Ip4Address" access="read"/>\
            <property type="u" name="State" access="read"/>\
            <property type="(uu)" name="StateReason" access="read"/>\
            <property type="o" name="ActiveConnection" access="read"/>\
            <property type="o" name="Ip4Config" access="read"/>\
            <property type="o" name="Dhcp4Config" access="read"/>\
            <property type="o" name="Ip6Config" access="read"/>\
            <property type="o" name="Dhcp6Config" access="read"/>\
            <property type="b" name="Managed" access="readwrite"/>\
            <property type="b" name="Autoconnect" access="readwrite"/>\
            <property type="b" name="FirmwareMissing" access="read"/>\
            <property type="b" name="NmPluginMissing" access="read"/>\
            <property type="u" name="DeviceType" access="read"/>\
            <property type="ao" name="AvailableConnections" access="read"/>\
            <property type="s" name="PhysicalPortId" access="read"/>\
            <property type="u" name="Mtu" access="read"/>\
            <property type="u" name="Metered" access="read"/>\
            <property type="aa{sv}" name="LldpNeighbors" access="read"/>\
            <property type="b" name="Real" access="read"/>\
            <property type="u" name="Ip4Connectivity" access="read"/>\
            <property type="u" name="Ip6Connectivity" access="read"/>\
            <property type="u" name="InterfaceFlags" access="read"/>\
            <property type="s" name="HwAddress" access="read"/>\
            <property type="ao" name="Ports" access="read"/>\
        </interface>\
    </node>\
';
const NetworkManagerDeviceProxy = Gio.DBusProxy.makeProxyWrapper(networkManagerDeviceInterfaceXml);

const networkManagerConnectionActiveInterfaceXml = '\
    <node>\
        <interface name="org.freedesktop.NetworkManager.Connection.Active">\
            <signal name="StateChanged">\
                <arg type="u" name="state"/>\
                <arg type="u" name="reason"/>\
            </signal>\
            <property type="o" name="Connection" access="read"/>\
            <property type="o" name="SpecificObject" access="read"/>\
            <property type="s" name="Id" access="read"/>\
            <property type="s" name="Uuid" access="read"/>\
            <property type="s" name="Type" access="read"/>\
            <property type="ao" name="Devices" access="read"/>\
            <property type="u" name="State" access="read"/>\
            <property type="u" name="StateFlags" access="read"/>\
            <property type="b" name="Default" access="read"/>\
            <property type="o" name="Ip4Config" access="read"/>\
            <property type="o" name="Dhcp4Config" access="read"/>\
            <property type="b" name="Default6" access="read"/>\
            <property type="o" name="Ip6Config" access="read"/>\
            <property type="o" name="Dhcp6Config" access="read"/>\
            <property type="b" name="Vpn" access="read"/>\
            <property type="o" name="Master" access="read"/>\
        </interface>\
    </node>\
';
const NetworkManagerConnectionActiveProxy = Gio.DBusProxy.makeProxyWrapper(networkManagerConnectionActiveInterfaceXml);


export class NetworkState {
    networkManager;

    constructor() {
        // Keep a reference to NetworkManager instance to prevent GC
        this.networkManager = new NetworkManager('/org/freedesktop/NetworkManager');
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
class NetworkManagerStateItem extends NetworkManagerStateItemSuper {
    // conceptually, the variables below are 'protected'
    static _wellKnownName  = 'org.freedesktop.NetworkManager';
    static _emitSignalProxyUpdated = 'connection-updated';
    static _propertiesChanged = 'g-properties-changed';

    // conceptually, the variables below are 'protected'
    _objectPath;
    _proxyObj = null;
    _childNetworkManagerStateItems = new Map(); // map of object path to object for each related child NetworkManagerStateItem
    _handlerId;
    _proxyObjHandlerId;

    constructor(objectPath) {
        super();
        if (this.constructor === NetworkManagerStateItem)
            throw new Error('NetworkManagerStateItem is an abstract class. Do not instantiate.');
        this._objectPath = objectPath;
        console.debug(`debug 1 - Instantiating ${this.constructor.name} with object path: ${this._objectPath}`);
    }

    destroy() {
        console.debug(`debug 1 - Destroying ${this.constructor.name} with object path: ${this._objectPath}`);
        // disconnect any proxy signals
        if (this._proxyObj) { // Need to confirm existence since we don't always keep the proxy
            this._proxyObj.disconnect(this._proxyObjHandlerId);
            this._proxyObj = null;
        }
        // handle children
        Array.from(this._childNetworkManagerStateItems.values()).forEach(child => {
            // disconnect any gjs signals
            child.disconnectItem();
            // call destroy on children
            child.destroy();
        });
    }

    // Use this instead of `EventEmitter.connect` because we will always use the same signal, and track the handler in
    // the child object. This is safe because no child ever has mutliple parents (ie listeners) and we always use the
    // same signal.
    connectItem(callback) {
        this._handlerId = this.connect(NetworkManagerStateItem._emitSignalProxyUpdated, callback);
        console.debug(`debug 1 - connected handler: ${this._handlerId}`);
    }

    disconnectItem() {
        console.debug(`debug 1 - disconnecting handler: ${this._handlerId}`);
        this.disconnect(this._handlerId);
    }

    // conceptually, the methods below are 'protected'
    _emit() {
        console.log('emitting signal:');
        this.emit(NetworkManagerStateItem._emitSignalProxyUpdated);
    }
}


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
            () => this.destroy()
        );
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
        const networkManagerDevice = new NetworkManagerDevice(device);
        // Add to child devices
        this._childNetworkManagerStateItems.set(device, networkManagerDevice);
        // Listen for emitted signals and relay them
        networkManagerDevice.connectItem(() => {
            this._emit();
        });
    }

    #removeDevice(deviceObjectPath) { // e.g. /org/freedesktop/NetworkManager/Devices/1
        // clean up old device if applicable
        console.debug(`debug 1 - Removing device: ${deviceObjectPath}`); // e.g. /org/freedesktop/NetworkManager/Devices/1
        const deviceObj = this._childNetworkManagerStateItems.get(deviceObjectPath);
        if (deviceObj) {
            deviceObj.disconnectItem();
            this._childNetworkManagerStateItems.delete(deviceObjectPath);
            deviceObj.destroy();
        }
    }
}

class NetworkManagerDevice extends NetworkManagerStateItem {
    // from https://developer-old.gnome.org/NetworkManager/stable/nm-dbus-types.html#NMDeviceType
    static NM_DEVICE_TYPE_WIFI = 2;
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
                if (proxy.DeviceType === NetworkManagerDevice.NM_DEVICE_TYPE_WIFI) {
                    this.isWifiDevice = true;
                    // Use DeviceType to decide whether to continue. We will only track wireless devices. For wireless, the device type is NM_DEVICE_TYPE_WIFI (2).
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
                } else if (!NetworkManagerDevice.#isConnectionActive(oldValue) && NetworkManagerDevice.#isConnectionActive(value)) {
                    // connection has toggled from inactive to active
                    console.debug('debug 2 - connection toggled from inactive to active');
                    // The connection was inactive ('/'), so there was no child. Don't call #deleteConnection. This
                    // asymmetry is OK. The add above woudln't actually put the connection into the child map. It would
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
        child.disconnectItem();
        child.destroy();
    }

    #addConnectionInfo() {
        this.#activeConnection = this._proxyObj.ActiveConnection; // e.g. / (if not active), /org/freedesktop/NetworkManager/ActiveConnection/1 (if active)
        console.debug(`debug 1 - Adding connection ${this.#activeConnection}`);
        if (NetworkManagerDevice.#isConnectionActive(this.#activeConnection)) { // this connection is active, make another dbus call
            const networkManagerConnectionActive = new NetworkManagerConnectionActive(this.#activeConnection);
            this._childNetworkManagerStateItems.set(this.#activeConnection, networkManagerConnectionActive);
            // Listen for emitted signals and relay them
            networkManagerConnectionActive.connectItem(() => {
                this._emit();
            });
        }
    }
}

class NetworkManagerConnectionActive extends NetworkManagerStateItem {
    constructor(objectPath) {
        // example objectPath: /org/freedesktop/NetworkManager/ActiveConnection/1
        super(objectPath);
        this.#getDbusProxyObject();
    }

    get activeConnectionId() {
        return this._proxyObj.Id; // e.g. Wired Connection 1
    }

    get activeConnectionSettings() {
        return this._proxyObj.Connection; // e.g. /org/freedesktop/NetworkManager/Settings/5
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
                console.log(`Wireless connection ID: ${this.activeConnectionId}`);
                console.log(`Settings object path: ${this.activeConnectionSettings}`);

                // monitor for changes
                this._proxyObjHandlerId = networkManagerConnectionActiveProxy.connect(NetworkManagerStateItem._propertiesChanged, this.#proxyUpdated.bind(this));
                this._emit();
            },
            null,
            Gio.DBusProxyFlags.NONE
        );
    }

    #proxyUpdated(proxy, changed, invalidated) {
        console.debug('debug 1 - Proxy updated - NetworkManagerConnectionActive');
        // The only propertiy I care about has a getter that accesses the proxy directly. No need to do anything here besides emit if necessary.
        // There are no children to worry about either.

        // check for which property was updated and only emit if we need to
        for (const [name, value] of Object.entries(changed.deepUnpack())) {
            console.debug('debug 3 - something changed - NetworkManagerConnectionActive');
            console.debug(`debug 3 - name: ${name}`);
            console.debug(`debug 3 - value: ${value.recursiveUnpack()}`);
            // Assume the Connection is never updated without the Id also being updated.
            if (name === 'Id') {
                console.debug(`debug 2 - ID updated to ${this._proxyObj.Id}`);
                // the ID has changed, emit and stop checking for other changes
                this._emit();
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
