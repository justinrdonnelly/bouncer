import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

export class ZoneForConnection {

    static #wellKnownName  = 'org.freedesktop.NetworkManager';
    static #iface  = 'org.freedesktop.NetworkManager.Settings.Connection';

    static async #getZoneDbusCall(objectPath) {
        const parameters = null;

        // I can't seem to make this call without a callback (was hoping it would return a promise)
        return new Promise((resolve, reject) => {
            Gio.DBus.system.call(
                ZoneForConnection.#wellKnownName,
                objectPath,
                ZoneForConnection.#iface,
                'GetSettings', // method
                parameters,
                null, //reply type
                Gio.DBusCallFlags.NONE, // might want ALLOW_INTERACTIVE_AUTHORIZATION - https://gjs-docs.gnome.org/gio20/gio.dbuscallflags
                -1, // timeout
                null, // cancellable
                (connection, res) => {
                    try {
                        // throw new Error('hi'); // for testing error handling
                        const reply = connection.call_finish(res);
                        resolve(reply)
                    } catch (e) {
                        if (e instanceof Gio.DBusError)
                            Gio.DBusError.strip_remote_error(e);
                        reject(e);
                    }
                }
            );
        });
    }

    static async getZone(objectPath) {
        const dbusResult = await ZoneForConnection.#getZoneDbusCall(objectPath);
        const zone = dbusResult.get_child_value(0).recursiveUnpack()['connection']['zone'];
        // console.log(`zone (inside): ${zone}`);
        return zone;
    }

    static async setZone(objectPath, zone) {
        // get existing settings
        let dbusResult = await ZoneForConnection.#getZoneDbusCall(objectPath);
        // create a new variant with the correct zone
        const parameters = ZoneForConnection.#createGvariantTuple(dbusResult, zone);
        // replace zone
        return new Promise((resolve, reject) => {
            Gio.DBus.system.call(
                ZoneForConnection.#wellKnownName,
                objectPath,
                ZoneForConnection.#iface,
                'Update', // method
                parameters,
                null, //reply type
                Gio.DBusCallFlags.NONE, // might want ALLOW_INTERACTIVE_AUTHORIZATION - https://gjs-docs.gnome.org/gio20/gio.dbuscallflags
                -1, // timeout
                null, // cancellable
                (connection, res) => {
                    try {
                        // throw new Error('hi'); // for testing error handling
                        connection.call_finish(res); // you need to make this call in order to get errors to reject
                        resolve();
                    } catch (e) {
                        if (e instanceof Gio.DBusError)
                            Gio.DBusError.strip_remote_error(e);
                        reject(e);
                    }
                }
            );
        });
    }

    static #createGvariantTuple(dbusResult, newZone) {
        const newZoneVariant = GLib.Variant.new_string(newZone);
        const unTupledDbusResult = dbusResult.get_child_value(0);
        const unpackedDbusResult = unTupledDbusResult.deepUnpack();
        unpackedDbusResult['connection']['zone'] = newZoneVariant;
        const packedDbusResult = new GLib.Variant('(a{sa{sv}})', [unpackedDbusResult]);
        return packedDbusResult;

        // from d-feet, the "pretty" type is: Dict of {String, Dict of {String, Variant}}
        // properties: a{sa{sv}} - but you'll have to make it a tuple: (a{sa{sv}})
        // connection: a{sv}
    }
}
