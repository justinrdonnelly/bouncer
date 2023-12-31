/*
 * I need to make 3 method calls:
 * 1. List all zones - getZones()
 * 2. Get default zone - getDefaultZone() (this is under a different interface than the other 2)
 * 3. Get the current zone for the interface in question (this will be pre-populated on the window) - getZoneOfInterface('enp1s0')
 */

// We have 3 different methods to call under 2 different dbus interfaces. We won't bother with a proxy.

export class FirewalldZones {
    static async getZones() {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    resolve(['foo', 'bar', 'baz']);
                    //throw new Error('DOH');
                } catch (e) {
                    reject(e.toString());
                }
            }, "1000");
        });
    }

    static async getDefaultZone() {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    resolve('foo');
                    //throw new Error('DOH');
                } catch (e) {
                    reject(e.toString());
                }
            }, "1000");
        });
    }

    static async getZoneOfInterface(networkInterface) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    resolve('bar');
                    //throw new Error('DOH');
                } catch (e) {
                    reject(e.toString());
                }
            }, "1000");
        });
    }

}
