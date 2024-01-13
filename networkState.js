import Gio from 'gi://Gio';

//import EventEmitter from 'resource:///org/gnome/shell/misc/signals.js'; // works only in GSEs?
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
class NetworkManagerStateItem /*extends EventEmitter*/ {

    // TODO: These can be helpful for debugging, but should eventually be removed
    static #objectCount = 0;
    _id;

    // conceptually, the variables below are 'protected'
    static _wellKnownName  = 'org.freedesktop.NetworkManager';
    static _emitSignalProxyUpdated = 'dbus-info-updated'; // used for the initial creation, and any subsequent updates
    static _propertiesChanged = 'g-properties-changed';

    // conceptually, the variables below are 'protected'
    _objectPath;
    _proxyObj = null;
    _childNetworkManagerStateItems = new Map(); // map of object path to object for each related child NetworkManagerStateItem
    _imReady = false; // whether this proxy is ready for use (ignores status of child proxy NetworkManagerStateItems)
    _handlerId;
    _proxyObjHandlerId;

    constructor(objectPath) {
        //super();
        if (this.constructor === NetworkManagerStateItem) {
            throw new Error("NetworkManagerStateItem is an abstract class. Do not instantiate.");
        }
        this._id = NetworkManagerStateItem.#objectCount++;
        this._objectPath = objectPath;
    }

    destroy() {
        console.log(`debug 1 - Destroying ${this.constructor.name} with object path: ${this._objectPath}`);
        // disconnect any proxy signals
        if (this._proxyObj) { // Need to confirm existence since we don't always keep the proxy
            this._proxyObj.disconnect(this._proxyObjHandlerId);
        }
        // handle children
        Array.from(this._childNetworkManagerStateItems.values()).forEach(child => {
            // disconnect any gjs signals
            child.disconnectItem();
            // call destroy on children
            child.destroy();
        });
    }

    // override the parent connect because we will always use the same signal, and track the handler in the child object
    // this works because no child ever has mutliple parents and we always use the same signal
    connectItem(callback) {
        // TODO: this is part of EventEmitter
        //this._handlerId = super.connect(NetworkManagerStateItem._emitSignalProxyUpdated, callback);
        //console.log(`object: ${this._id}; connected handler: ${this._handlerId}`);
    }

    // override the parent disconnect because we are tracking the handler ID here
    disconnectItem() {
        // TODO: this is part of EventEmitter
        //console.log(`object: ${this._id}; disconnecting handler: ${this._handlerId}`);
        //super.disconnect(this._handlerId);
    }

    // whether this proxy and it's related "children" are ready for use
    isReadyToEmit() {
        // TODO: Does this need to be in the superclass? We should only need to emit when an active connection changes. Test in a real extension.
        return this._imReady && Array.from(this._childNetworkManagerStateItems.values()).every((child) => child.isReadyToEmit());
    }

    // conceptually, the methods below are 'protected'
    _ifReadyEmit() {
        if (this.isReadyToEmit()) {
            this._emit();
        }
    }

    _emit() {
        console.log("emitting signal:");
        // TODO: Once I can actually extend EventEmitter, uncomment the next line and it should work
        //this.emit(NetworkManagerStateItem._emitSignalProxyUpdated); // emit the "done" signal
    }
}


class NetworkManager extends NetworkManagerStateItem {

    constructor(objectPath) {
        // example objectPath: /org/freedesktop/NetworkManager (this is always what it is)
        super(objectPath);
        this.#getDbusProxyObject();
    }

    get networkDevices() {
        return Array.from(this._childNetworkManagerStateItems.values());
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
                    console.error(error);
                    return;
                }
                this._proxyObj = proxy;
                this.#addDevices();
                // monitor for property changes
                this._proxyObjHandlerId = networkManagerProxy.connect(NetworkManagerStateItem._propertiesChanged, this.#proxyUpdated.bind(this));

                this._imReady = true;
                // TODO: Don't emit here? We should only need to emit when an active connection changes. Test in a real extension.
                this._ifReadyEmit(); // always check here in case there are no children
            },
            null,
            Gio.DBusProxyFlags.NONE
        );
    }

    #proxyUpdated(proxy, changed, invalidated) {
        console.log('debug 1 - Proxy updated - NetworkManager');
        // NetworkManager doesn't have any state of its own. Just see if there are new children to add, or old children to remove.
        // We don't need to emit unless we find a change that we care about.
        // TODO: Don't emit here? We should only need to emit when an active connection changes. Test in a real extension.
        let needToEmit = false;

        // handle updated device list
        for (const [name, value] of Object.entries(changed.deepUnpack())) {
            console.log('debug 3 - something changed - NetworkManager');
            console.log(`debug 3 - name: ${name}`);
            console.log(`debug 3 - value: ${value.recursiveUnpack()}`);
            if (name === 'Devices') {
                // compare to previous list. add/remove as necessary. emit when done.
                const oldDeviceObjectPaths = Array.from(this._childNetworkManagerStateItems.keys());
                const newDeviceObjectPaths = value.recursiveUnpack();
                console.log(`debug 2 - Devices changed`);
                console.log(`debug 2 - New Devices: ${newDeviceObjectPaths}`);
                console.log(`debug 2 - Old Devices: ${oldDeviceObjectPaths}`);
                const addedDeviceObjectPaths = newDeviceObjectPaths.filter(x => !oldDeviceObjectPaths.includes(x));
                const removedDeviceObjectPaths = oldDeviceObjectPaths.filter(x => !newDeviceObjectPaths.includes(x));
                console.log("debug 2 - devices to remove: " + removedDeviceObjectPaths);
                console.log("debug 2 - devices to add: " + addedDeviceObjectPaths);
                removedDeviceObjectPaths.forEach(d => {
                    console.log(`debug 2 - Removing device ${d}`);
                    this.#removeDevice(d);
                });
                addedDeviceObjectPaths.forEach(d => {
                    console.log(`debug 2 - Adding device ${d}`);
                    this.#addDevice(d);
                });
                needToEmit = true;
            }
        }

        // IIUC this means that I would need to make another async call to get the updated devices. A better alternative would be to pass the GET_INVALIDATED_PROPERTIES flag during proxy construction. For now, we'll just log an error and leave a TODO
        for (const name of invalidated) {
            //console.log(`Property: ${name} invalidated`);
            if (name === 'Devices') {
                console.error('Devices is invalidated. This is not supported.')
                this.networkDevices.forEach(d => this.#removeDevice(d));
                needToEmit = true;
                // TODO
            }
        }

        if (needToEmit) {
            this._ifReadyEmit();
        }
    }

    #addDevices() {
        const devices = this._proxyObj.Devices; // array of object paths
        //console.log(`Devices: ${devices}`); // e.g. /org/freedesktop/NetworkManager/Devices/1
        devices.forEach(d => this.#addDevice(d));
        // TODO: Don't emit here? We should only need to emit when an active connection changes. Test in a real extension.
        this._ifReadyEmit();
    }

    #addDevice(device) { // e.g. /org/freedesktop/NetworkManager/Devices/1
        this.#removeDevice(device); // if the device already exists, remove it
        console.log(`Device: ${device}`); // e.g. /org/freedesktop/NetworkManager/Devices/1
        // Instantiate a new class that will make another dbus call
        const networkManagerDevice = new NetworkManagerDevice(device);
        // Add to child devices
        this._childNetworkManagerStateItems.set(device, networkManagerDevice);
        // Connect to listen to emitted signals
        networkManagerDevice.connectItem(() => {
            //console.log(device);
            //console.log("interface: " + networkManagerDevice.deviceInterfaceName); // e.g. ens3
            this._ifReadyEmit();
        });
    }

    #removeDevice(deviceString) { // e.g. /org/freedesktop/NetworkManager/Devices/1
        // clean up old device if applicable
        const deviceObj = this._childNetworkManagerStateItems.get(deviceString);
        if (deviceObj) {
            deviceObj.disconnectItem();
            this._childNetworkManagerStateItems.delete(deviceString);
            deviceObj.destroy();
        }
    }
}

class NetworkManagerDevice extends NetworkManagerStateItem {

    // from https://developer-old.gnome.org/NetworkManager/stable/nm-dbus-types.html#NMDeviceType
    static NM_DEVICE_TYPE_WIFI = 2;
    #activeConnection;

    constructor(objectPath) {
        // example objectPath: /org/freedesktop/NetworkManager/Devices/1
        super(objectPath);
        this.#getDbusProxyObject();
    }

    // this is a map, but there should only ever be 1 entry
    get connections() {
        return Array.from(this._childNetworkManagerStateItems.values());
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
                    console.error(error);
                    return;
                }
                if (proxy.DeviceType === NetworkManagerDevice.NM_DEVICE_TYPE_WIFI) {
                    // Use DeviceType to decide whether to continue. We will only track wireless devices. For wireless, the device type is NM_DEVICE_TYPE_WIFI (2).
                    this._proxyObj = proxy;
                    this.#addConnectionInfo();
                    console.log(`ActiveConnection: ${this.#activeConnection}`)
                    // monitor for property changes
                    this._proxyObjHandlerId = networkManagerDeviceProxy.connect(NetworkManagerStateItem._propertiesChanged, this.#proxyUpdated.bind(this));
                }

                this._imReady = true;
                // TODO: Don't emit here? We should only need to emit when an active connection changes. Test in a real extension.
                this._ifReadyEmit(); // always check here in case there are no children
            },
            null,
            Gio.DBusProxyFlags.NONE
        );
    }

    #proxyUpdated(proxy, changed, invalidated) {
        console.log('debug 1 - Proxy updated - NetworkManagerDevice');
        // NetworkManagerDevice doesn't have any state of its own. Just see if there are new children to add, or old children to remove.
        // We don't need to emit unless we find a change that we care about.
        // TODO: Don't emit here? We should only need to emit when an active connection changes. Test in a real extension.
        let needToEmit = false;

        // handle ActiveConnection
        for (const [name, valueVariant] of Object.entries(changed.deepUnpack())) {
            console.log('debug 3 - something changed - NetworkManagerDevice');
            console.log(`debug 3 - name: ${name}`);
            console.log(`debug 3 - valueVariant: ${valueVariant.recursiveUnpack()}`);
            if (name === 'ActiveConnection') {
                // compare to previous list. add/remove as necessary. emit when done.
                const value = valueVariant.deepUnpack();
                const oldValue = this.#activeConnection;
                console.log(`debug 2 - NetworkManagerDevice - old ActiveConnection: ${oldValue}`);
                console.log(`debug 2 - NetworkManagerDevice - new ActiveConnection: ${value}`);
                // TODO: consider some reuse here
                if ((value === undefined || value === null || value === '/') && !(oldValue === undefined || oldValue === null || oldValue === '/')) { // connection has toggled from active to inactive
                    console.log("debug 2 - connection toggled from active to inactive");
                    this.#deleteConnection(oldValue); // destroy old child
                    this.#addConnectionInfo(); // this will add the child ('/' in this case)
                }
                else if (!(value === undefined || value === null || value === '/') && (oldValue === undefined || oldValue === null || oldValue === '/')) { // connection has toggled from inactive to active
                    console.log("debug 2 - connection toggled from inactive to active");
                    // If the connection was inactive ('/'), there was no child. Don't call #deleteConnection.
                    this.#addConnectionInfo(); // this will add the child
                }
                // In my testing, this didn't actually happen. The connection was removed with 1 proxy update, then a new connection added with another.
                else if (!(value === undefined || value === null || value === '/') && !(oldValue === undefined || oldValue === null || oldValue === '/')) { // connection has changed from one active connection to another
                    console.log(`debug 2 - connection changed from one active connection (${oldValue}) to another (${value})`);
                    this.#deleteConnection(oldValue); // destroy old child
                    this.#addConnectionInfo(); // this will add the child
                }
                else {
                    console.error(`ERROR: Unexpected transition for ActiveConnection (inactive to inactive). Old: ${oldValue}; New: ${value}`);
                    this.#addConnectionInfo(); // this will add the child
                }
                needToEmit = true;
            }
        }

        // IIUC this means that I would need to make another async call to get the updated devices. A better alternative would be to pass the GET_INVALIDATED_PROPERTIES flag during proxy construction. For now, we'll just log an error and leave a TODO
        for (const name of invalidated) {
            //console.log(`Property: ${name} invalidated`);
            if (name === 'ActiveConnection') {
                console.error('ActiveConnection is invalidated. This is not supported.')
                needToEmit = true;
                // TODO
            }
        }

        if (needToEmit) {
            this._ifReadyEmit();
        }
    }

    #deleteConnection(activeConnection) { // delete the child connection
        console.log(`debug 2 - removing connection ${activeConnection}`);
        const child = this._childNetworkManagerStateItems.get(activeConnection);
        this._childNetworkManagerStateItems.delete(activeConnection);
        child.disconnectItem();
        child.destroy();
    }

    #addConnectionInfo() {
        this.#activeConnection = this._proxyObj.ActiveConnection; // e.g. / (if not active), /org/freedesktop/NetworkManager/ActiveConnection/1 (if active)
        console.log(`debug 2 - adding connection ${this.#activeConnection}`);
        if (this.#activeConnection !== undefined && this.#activeConnection !== null && this.#activeConnection !== "/") { // this connection is active, make another dbus call
            const networkManagerConnectionActive = new NetworkManagerConnectionActive(this.#activeConnection);
            this._childNetworkManagerStateItems.set(this.#activeConnection, networkManagerConnectionActive);
            networkManagerConnectionActive.connectItem(() => {
                this._ifReadyEmit();
            });
        }
        // TODO: Don't emit here? We should only need to emit when an active connection changes. Test in a real extension.
        this._ifReadyEmit(); // always check here in case there are no children
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
                    logError(error);
                    return;
                }
                this._proxyObj = sourceObj;
                console.log(`Connection ID: ${this.activeConnectionId}`)

                // monitor for changes
                this._proxyObjHandlerId = networkManagerConnectionActiveProxy.connect(NetworkManagerStateItem._propertiesChanged, this.#proxyUpdated.bind(this));

                this._imReady = true;
                this._ifReadyEmit();
            },
            null,
            Gio.DBusProxyFlags.NONE
        );
    }

    #proxyUpdated(proxy, changed, invalidated) {
        console.log('debug 1 - Proxy updated - NetworkManagerConnectionActive');
        // The only propertiy I care about has a getter that accesses the proxy directly. No need to do anything here besides emit if necessary.
        // There are no children to worry about either.

        // check for which property was updated and only emit if we need to
        for (const [name, value] of Object.entries(changed.deepUnpack())) {
            console.log('debug 3 - something changed - NetworkManagerConnectionActive');
            console.log(`debug 3 - name: ${name}`);
            console.log(`debug 3 - value: ${value.recursiveUnpack()}`);
            if (name === "Id") {
                console.log(`debug 2 - ID updated to ${this._proxyObj.Id}`);
                // the ID has changed, emit and stop checking for other changes
                this._ifReadyEmit();
                return;
            }
        }
        // IIUC this means that I would need to make another async call to get the updated devices. A better alternative would be to pass the GET_INVALIDATED_PROPERTIES flag during proxy construction. For now, we'll just log an error and leave a TODO
        for (const name of invalidated) {
            //console.log(`Property: ${name} invalidated`);
            if (name === 'Id') {
                console.error('Id is invalidated. This is not supported.')
                needToEmit = true;
                // TODO
            }
        }
    }
}

