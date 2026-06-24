/* networkManagerConnectionSettings.js
 *
 * Copyright 2026 Justin Donnelly
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * SPDX-License-Identifier: MPL-2.0
 */

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

const networkManagerBusName = 'org.freedesktop.NetworkManager';
const networkManagerSettingsObjectPath = '/org/freedesktop/NetworkManager/Settings';
const networkManagerSettingsInterface = 'org.freedesktop.NetworkManager.Settings';
const networkManagerConnectionInterface = 'org.freedesktop.NetworkManager.Settings.Connection';

export async function getNetworkManagerConnectionByUuid(connectionUuid) {
    const objectPath = await getNetworkManagerConnectionPathByUuid(connectionUuid);
    const settings = await getNetworkManagerConnectionSettings(objectPath);
    return { objectPath, settings };
}

function getNetworkManagerConnectionPathByUuid(connectionUuid) {
    return new Promise((resolve, reject) => {
        Gio.DBus.system.call(
            networkManagerBusName,
            networkManagerSettingsObjectPath,
            networkManagerSettingsInterface,
            'GetConnectionByUuid',
            new GLib.Variant('(s)', [connectionUuid]),
            new GLib.VariantType('(o)'),
            Gio.DBusCallFlags.NONE,
            -1,
            null,
            (connection, res) => {
                try {
                    const reply = connection.call_finish(res);
                    resolve(reply.get_child_value(0).recursiveUnpack());
                } catch (e) {
                    if (e instanceof Gio.DBusError)
                        Gio.DBusError.strip_remote_error(e);
                    reject(e);
                }
            }
        );
    });
}

function getNetworkManagerConnectionSettings(objectPath) {
    return new Promise((resolve, reject) => {
        Gio.DBus.system.call(
            networkManagerBusName,
            objectPath,
            networkManagerConnectionInterface,
            'GetSettings',
            null,
            new GLib.VariantType('(a{sa{sv}})'),
            Gio.DBusCallFlags.NONE,
            -1,
            null,
            (connection, res) => {
                try {
                    const reply = connection.call_finish(res);
                    resolve(reply.get_child_value(0).recursiveUnpack());
                } catch (e) {
                    if (e instanceof Gio.DBusError)
                        Gio.DBusError.strip_remote_error(e);
                    reject(e);
                }
            }
        );
    });
}
