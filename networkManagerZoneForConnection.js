import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

export class NetworkManagerZoneForConnection {
    static async _getZoneDbusCall(objectPath) {
        const parameters = null;

        // I can't seem to make this call without a callback (was hoping it would return a promise)
        return new Promise((resolve, reject) => {
            // try { // This try didn't make any difference. Errors still were converted into rejects.
                //throw new Error("hi");
                Gio.DBus.system.call(
                    'org.freedesktop.NetworkManager', // name
                    objectPath, // object path
                    'org.freedesktop.NetworkManager.Settings.Connection', // interface
                    'GetSettings', // method
                    parameters,
                    null, //reply type
                    Gio.DBusCallFlags.NONE, // might want ALLOW_INTERACTIVE_AUTHORIZATION - https://gjs-docs.gnome.org/gio20/gio.dbuscallflags
                    -1, // timeout
                    null, // cancellable
                    (connection, res) => {
                        // I have confirmed that an error in the callback without the try here is not handled well.
                        try {
                            const reply = connection.call_finish(res);
                            resolve(reply)
                            // TODO: getZone depends on the code below. either move it, or uncomment it.
                            // const value = reply.get_child_value(0);
                            // const response = value.recursiveUnpack();
                            // // throw new Error("hi");
                            // resolve(response);
                        } catch (e) {
                            if (e instanceof Gio.DBusError)
                                Gio.DBusError.strip_remote_error(e);
                            reject(e);
                        }
                    }
                );
            // } catch (e) {
            //     if (e instanceof Gio.DBusError)
            //         Gio.DBusError.strip_remote_error(e);
            //     reject(e)
            // }
        });
    }

    static async getZone(objectPath) {
        const dbusResult = await NetworkManagerZoneForConnection._getZoneDbusCall(objectPath);
        const zone = dbusResult.get_child_value(0).recursiveUnpack()['connection']['zone'];
        console.log(`zone (inside): ${zone}`);
        return zone;
    }

    static async setZone(objectPath, zone) {
        // get existing settings
        let dbusResult;
        try { // this doesn't help with the warning
            dbusResult = await NetworkManagerZoneForConnection._getZoneDbusCall(objectPath);
        } catch (e) {
            log.error("DOH");
        }
        // sleep for 5 seconds
        console.log(`got response (zone: ${dbusResult.get_child_value(0).recursiveUnpack()['connection']['zone']})`)
        await new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve();
            }, "5000");
        });
        console.log('sleep over, setting zone back');


        // create a new variant with the correct zone
        const parameters = NetworkManagerZoneForConnection.createGvariantTuple(dbusResult, zone);


        // replace zone
        //dbusResult['connection']['zone'] = zone;
        // TODO: I think we got our logic fixed. I think it was due to a missing `await`. Now we need to convert the dbus response into the correctly typed gvariant.
        return new Promise((resolve, reject) => {
            // try {
                Gio.DBus.system.call(
                    'org.freedesktop.NetworkManager', // name
                    objectPath, // object path
                    'org.freedesktop.NetworkManager.Settings.Connection', // interface
                    'Update', // method
                    parameters,
                    null, //reply type
                    Gio.DBusCallFlags.NONE, // might want ALLOW_INTERACTIVE_AUTHORIZATION - https://gjs-docs.gnome.org/gio20/gio.dbuscallflags
                    -1, // timeout
                    null, // cancellable
                    (connection, res) => {
                        try {
                            console.log('in callback from Update');
                            // console.log(res);
                            const reply = connection.call_finish(res);
                            // console.log(reply);
                            // const value = reply.get_child_value(0); // causes a CRITICAL log statement
                            // console.log(value); // value is null
                            resolve();
                            // // TODO: the line below may fail. There is no response (or it's void, or whatever the gvariant terminology is)
                            // const response = value.recursiveUnpack();
                            // console.log(response);
                            // resolve(response);
                        } catch (e) {
                            if (e instanceof Gio.DBusError)
                                Gio.DBusError.strip_remote_error(e);
                            reject(e);
                        }
                    }
                );
            // } catch (e) {
            //     if (e instanceof Gio.DBusError)
            //         Gio.DBusError.strip_remote_error(e);
            //     reject(e)
            // }
        });
    }

    static createGvariantTuple(dbusResult, newZone) {
        return dbusResult;
    }

}
