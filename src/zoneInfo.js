/* zoneInfo.js
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

// We have 2 different methods to call under different dbus interfaces. We won't bother with a proxy.

export class ZoneInfo {
    static #wellKnownName = 'org.fedoraproject.FirewallD1';
    static #objectPath = '/org/fedoraproject/FirewallD1';

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
                // might want ALLOW_INTERACTIVE_AUTHORIZATION - https://gjs-docs.gnome.org/gio20/gio.dbuscallflags
                Gio.DBusCallFlags.NONE,
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
                // might want ALLOW_INTERACTIVE_AUTHORIZATION - https://gjs-docs.gnome.org/gio20/gio.dbuscallflags
                Gio.DBusCallFlags.NONE,
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
}
