/* zoneForConnection.js
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

export class ZoneForConnection {
    static #wellKnownName = 'org.freedesktop.NetworkManager';
    static #iface = 'org.freedesktop.NetworkManager.Settings.Connection';

    static #getSettings(objectPath) {
        const parameters = null;

        // I can't seem to make this call without a callback (was hoping it would return a promise)
        return new Promise((resolve, reject) => {
            Gio.DBus.system.call(
                ZoneForConnection.#wellKnownName,
                objectPath,
                ZoneForConnection.#iface,
                'GetSettings', // method
                parameters,
                null, // reply type
                // might want ALLOW_INTERACTIVE_AUTHORIZATION - https://gjs-docs.gnome.org/gio20/gio.dbuscallflags
                Gio.DBusCallFlags.NONE,
                -1, // timeout
                null, // cancellable
                (connection, res) => {
                    try {
                        // throw new Error('hi'); // for testing error handling
                        const reply = connection.call_finish(res);
                        console.debug('Retrieved connection settings: ' +
                            `${JSON.stringify(reply.get_child_value(0).recursiveUnpack())}`);
                        resolve(reply);
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
        const settings = await ZoneForConnection.#getSettings(objectPath);
        let zone = settings.get_child_value(0).recursiveUnpack()['connection']['zone'];
        if (zone === undefined)
            // convert undefined to null
            zone = null;
        console.log(`Current zone: ${zone}`);
        return zone;
    }

    static async setZone(objectPath, zone) {
        // get existing settings
        let settings = await ZoneForConnection.#getSettings(objectPath);
        // create a new variant with the correct zone
        const parameters = ZoneForConnection.#createGvariantTuple(settings, zone);
        // replace zone
        return new Promise((resolve, reject) => {
            Gio.DBus.system.call(
                ZoneForConnection.#wellKnownName,
                objectPath,
                ZoneForConnection.#iface,
                'Update', // method
                parameters,
                null, // reply type
                // might want ALLOW_INTERACTIVE_AUTHORIZATION - https://gjs-docs.gnome.org/gio20/gio.dbuscallflags
                Gio.DBusCallFlags.NONE,
                -1, // timeout
                null, // cancellable
                (connection, res) => {
                    try {
                        // throw new Error('hi'); // for testing error handling
                        connection.call_finish(res); // you need to make this call in order to get errors to reject
                        console.log(`Successfully set zone to ${zone}.`);
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
        const unTupledDbusResult = dbusResult.get_child_value(0);
        const unpackedDbusResult = unTupledDbusResult.deepUnpack();
        if (newZone !== null) {
            const newZoneVariant = GLib.Variant.new_string(newZone);
            unpackedDbusResult['connection']['zone'] = newZoneVariant;
        } else
            delete unpackedDbusResult['connection']['zone'];
        const packedDbusResult = new GLib.Variant('(a{sa{sv}})', [unpackedDbusResult]);
        return packedDbusResult;

        // from d-feet, the "pretty" type is: Dict of {String, Dict of {String, Variant}}
        // properties: a{sa{sv}} - but you'll have to make it a tuple: (a{sa{sv}})
        // connection: a{sv}
    }
}
