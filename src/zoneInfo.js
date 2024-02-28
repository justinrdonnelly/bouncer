import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

/*
 * I need to make 3 method calls:
 * 1. List all zones - getZones()
 * 2. Get default zone - getDefaultZone() (this is under a different interface than the other 2)
 * 3. Get the current zone for the interface in question (this will be pre-populated on the window) - getZoneOfInterface('enp1s0')
 */

// We have 3 different methods to call under 2 different dbus interfaces. We won't bother with a proxy.

export class ZoneInfo {
    static #wellKnownName  = 'org.fedoraproject.FirewallD1';
    static #objectPath  = '/org/fedoraproject/FirewallD1';

    static getZones() {
        const parameters = null;

        // I can't seem to make this call without a callback (was hoping it would return a promise)
        return new Promise((resolve, reject) => {
            Gio.DBus.system.call(
                ZoneInfo.#wellKnownName,
                ZoneInfo.#objectPath,
                'org.fedoraproject.FirewallD1.zone', // interface
                'getZones', // method
                parameters,
                null, // reply type
                Gio.DBusCallFlags.NONE, // might want ALLOW_INTERACTIVE_AUTHORIZATION - https://gjs-docs.gnome.org/gio20/gio.dbuscallflags
                -1, // timeout
                null, // cancellable
                (connection, res) => {
                    try {
                        const reply = connection.call_finish(res);
                        const value = reply.get_child_value(0);
                        const zones = value.recursiveUnpack();
                        console.log(`All zones: ${zones}`);
                        resolve(zones);
                    } catch (e) {
                        if (e instanceof Gio.DBusError)
                            Gio.DBusError.strip_remote_error(e);
                        reject(e);
                    }
                }
            );
        });
    }

    static getDefaultZone() {
        const parameters = null;

        // I can't seem to make this call without a callback (was hoping it would return a promise)
        return new Promise((resolve, reject) => {
            Gio.DBus.system.call(
                ZoneInfo.#wellKnownName,
                ZoneInfo.#objectPath,
                'org.fedoraproject.FirewallD1', // interface
                'getDefaultZone', // method
                parameters,
                null, // reply type
                Gio.DBusCallFlags.NONE, // might want ALLOW_INTERACTIVE_AUTHORIZATION - https://gjs-docs.gnome.org/gio20/gio.dbuscallflags
                -1, // timeout
                null, // cancellable
                (connection, res) => {
                    try {
                        const reply = connection.call_finish(res);
                        const value = reply.get_child_value(0);
                        const zone = value.recursiveUnpack();
                        console.log(`Default zone: ${zone}`);
                        resolve(zone);
                    } catch (e) {
                        if (e instanceof Gio.DBusError)
                            Gio.DBusError.strip_remote_error(e);
                        reject(e);
                    }
                }
            );
        });
    }

    static getZoneOfInterface(networkInterface) {
        const parameters = new GLib.Variant('(s)', [
            networkInterface,
        ]);

        // I can't seem to make this call without a callback (was hoping it would return a promise)
        return new Promise((resolve, reject) => {
            Gio.DBus.system.call(
                ZoneInfo.#wellKnownName,
                ZoneInfo.objectPath,
                'org.fedoraproject.FirewallD1.zone', // interface
                'getZoneOfInterface', // method
                parameters,
                null, // reply type
                Gio.DBusCallFlags.NONE, // might want ALLOW_INTERACTIVE_AUTHORIZATION - https://gjs-docs.gnome.org/gio20/gio.dbuscallflags
                -1, // timeout
                null, // cancellable
                (connection, res) => {
                    try {
                        const reply = connection.call_finish(res);
                        const value = reply.get_child_value(0);
                        const zone = value.recursiveUnpack();
                        console.log(`Zone of interface: ${zone}`);
                        resolve(zone);
                    } catch (e) {
                        if (e instanceof Gio.DBusError)
                            Gio.DBusError.strip_remote_error(e);
                        reject(e);
                    }
                }
            );
        });
    }
}
