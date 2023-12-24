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


export class NetworkState {
    constructor() {
        new NetworkManager('/org/freedesktop/NetworkManager');
    }
}

// An abstract class to hold a dbus proxy object. We will make multiple dbus calls based on the results of earlier calls, building a hierarchy.
class ProxyTree /*extends EventEmitter*/ {

    static emitSignalProxyUpdated = 'dbus-info-updated'; // used for the initial creation, and any subsequent updates
    static propertiesChanged = 'g-properties-changed';
    static objectCount = 0;

    constructor(objectPath) {
        //super();
        if (this.constructor === ProxyTree) {
            throw new Error("ProxyTree is an abstract class. Do not instantiate.");
        }
        this._id = ProxyTree.objectCount++;
        this._objectPath = objectPath;
        this._proxyObj = null;
        // TODO: we may be able to get away with an array here, but use a map for now
        this._childProxyTrees = new Map(); // map of object path to object for each related child ProxyTree
        this._imReady = false; // whether this proxy is ready for use (ignores status of child proxy trees)
    }

    destroy() {
    }

    // override the parent connect because we will always use the same signal, and track the handler in the child object
    // this works because no child ever has mutliple parents and we always use the same signal
    connectTree(callback) {
        this._handlerId = super.connect(ProxyTree.emitSignalProxyUpdated, callback);
        //console.log(`object: ${this._id}; connected handler: ${this._handlerId}`);
    }

    // override the parent disconnect because we are tracking the handler ID here
    disconnectTree() {
        //console.log(`object: ${this._id}; disconnecting handler: ${this._handlerId}`);
        super.disconnect(this._handlerId);
    }

    // whether this proxy and it's related "children" are ready for use
    isReadyToEmit() {
        return this._imReady && Array.from(this._childProxyTrees.values()).every((child) => child.isReadyToEmit());
    }

    _ifReadyEmit() {
        if (this.isReadyToEmit()) {
            this._emit();
        }
    }

    _emit() {
        console.log("emitting signal:");
        // TODO: Once I can actually extend EventEmitter, uncomment the next line and it should work
        //this.emit(ProxyTree.emitSignalProxyUpdated); // emit the "done" signal
    }
}


class NetworkManager extends ProxyTree {
    constructor(objectPath) {
        // example objectPath: /org/freedesktop/NetworkManager (this is always what it is)
        super(objectPath);
        console.log('hi');
        this._getDbusProxyObject();
    }

    get networkDevices() {
        console.log("getter");
        return Array.from(this._childProxyTrees.values())
    }

    // TODO: This all seems pretty generic. Can it be put in the super class?
    destroy() {
        // disconnect any proxy signals
        this._proxyObj.disconnect(this._proxyObjHandlerId);
        // handle children
        Array.from(this._childProxyTrees.values()).forEach(child => {
            // disconnect any gjs signals
            child.disconnectTree();
            // call destroy on children
            child.destroy();
        });
    }

    _getDbusProxyObject() {
        const networkManagerProxy = NetworkManagerProxy(
            Gio.DBus.system,
            'org.freedesktop.NetworkManager',
            this._objectPath,
            (proxy, error) => {
                if (error !== null) {
                    console.error(error);
                    return;
                }
                this._proxyObj = proxy;
                this._addDevices();
                // monitor for property changes
                this._proxyObjHandlerId = this._proxyObj.connect(ProxyTree.propertiesChanged, this._proxyUpdated.bind(this));

                this._imReady = true;
                this._ifReadyEmit(); // always check here in case there are no children
            },
            null,
            Gio.DBusProxyFlags.NONE
        );
    }

    _proxyUpdated(proxy, changed, invalidated) {
        // NetworkManager doesn't have any state of its own. Just see if there are new children to add, or old children to remove.
        // We don't need to emit unless we find a change that we care about.
        let needToEmit = false;

        // handle updated device list
        const propertiesChanged = changed.deepUnpack();
        for (const [name, value] of Object.entries(propertiesChanged)) {
            if (name === 'Devices') {
                // compare to previous list. add/remove as necessary. emit when done.
                // TODO: Once you add the child object, confirm this works correctly, then remove the logging.
                const oldDevices = this.networkDevices; // this is coming from my children
                const newDevices = value.recursiveUnpack();
                console.log(`Devices changed`);
                console.log(`New Devices: ${newDevices}`);
                console.log(`Old Devices: ${oldDevices}`);
                const addedDevices = newDevices.filter(x => !oldDevices.includes(x));
                const removedDevices = oldDevices.filter(x => !newDevices.includes(x));
                //console.log("devices to remove: " + removedDevices);
                //console.log("devices to add: " + addedDevices);
                removedDevices.forEach(d => {console.log(`Removing device ${d}`); this._removeDevice(d);});
                addedDevices.forEach(d => {console.log(`Adding device ${d}`); this._addDevice(d);});
                needToEmit = true;
            }
        }

        // IIUC this means that I would need to make another async call to get the updated devices. A better alternative would be to pass the GET_INVALIDATED_PROPERTIES flag during proxy construction. For now, we'll just log an error and leave a TODO
        for (const name of invalidated) {
            //console.log(`Property: ${name} invalidated`);
            if (name === 'Devices') {
                console.error('Devices is invalidated. This is not supported.')
                this.networkDevices.forEach(d => this._removeDevice(d));
                needToEmit = true;
                // TODO
            }
        }

        if (needToEmit) {
            this._ifReadyEmit();
        }
    }

    _addDevices() {
        const devices = this._proxyObj.Devices; // array of object paths
        console.log(`Devices: ${devices}`); // e.g. /org/freedesktop/NetworkManager/Devices/1
        devices.forEach(d => this._addDevice(d));
        this._ifReadyEmit();
    }

    _addDevice(device) { // e.g. /org/freedesktop/NetworkManager/Devices/1
        this._removeDevice(device); // if the device already exists, remove it
        console.log(`Device: ${device}`); // e.g. /org/freedesktop/NetworkManager/Devices/1
        // TODO
        // Instantiate a new class that will make another dbus call
        // Add to child devices
        // Connect to listen to emitted signals
    }

    _removeDevice(deviceString) { // e.g. /org/freedesktop/NetworkManager/Devices/1
        // clean up old device if applicable
        // TODO
    }


}
