/* dataMigration.js
 *
 * Copyright 2026 Justin Donnelly
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * SPDX-License-Identifier: MPL-2.0
 */

/* Functions for migrating ConnectionIdsSeen data
 *
 * The format of ConnectionIdsSeen data has changed over time. In order to support existing users, we migrate data from
 * old formats to new formats. These functions facilitate that.
 *
 * Client code will call migrateDataIfNecessary, passing the data as read from disk, and any additional arguments that
 * may be required for data migration. Migration functions are called in order.
 *
 * Each migration function determines if a migration is necessary. If not, it returns the data unmodified. If a
 * migration is necessary, it MUST RETURN A NEW OBJECT representing the migrated data.
 */

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

// Exported function that calls individual migration functions
export async function migrateDataIfNecessary(data, machineId) {
    let migratedData = data;

    migratedData = migrateConnectionIdsFromArrayToObject(migratedData, machineId);
    migratedData = await migrateConnectionNamesToUuids(migratedData, machineId);

    return migratedData;
}

// Migrate from v1 to v2
// Migrate from an array of connection names to an object with machine ID keys, and array of connection names for
// values.
function migrateConnectionIdsFromArrayToObject(data, machineId) {
    if (!Array.isArray(data))
        return data;

    console.log('Migrating data format from V1 to V2.');
    return {[machineId]: data};
}

// Migrate from v2 to v3 (v3 is the first version to include the version number in the data)
// Migrate from using the connection name to the connection UUID. Also add the version.
// This migration removes connection information from machine IDs other than this machine. The purpose of tracking
// connections by machine ID is so that if someone moves their data file to a new installation, Bouncer won't ignore
// connections that are actually new to NetworkManager. Connection information for other machines isn't useful, and
// besides, we can't migrate it anyway.
async function migrateConnectionNamesToUuids(data, machineId) {
    const version = 3;

    if (data.version >= version)
        return data;

    console.log('Migrating data format from V2 to V3.');
    const migratedData = new Map([['version', version]]);
    // eslint-disable-next-line security/detect-object-injection
    const connectionNames = data[machineId] ?? [];
    const connectionNameToUuid = connectionNames.length === 0 ? new Map() : await getConnectionNameToUuid();
    const migratedConnectionIdsSeen = [];
    for (const connectionName of connectionNames) {
        const connectionUuid = connectionNameToUuid.get(connectionName);
        if (connectionUuid === undefined) {
            console.warn(`Unable to find UUID for NetworkManager connection name: ${connectionName}`);
            continue;
        }
        migratedConnectionIdsSeen.push(connectionUuid);
    }
    migratedData.set(machineId, migratedConnectionIdsSeen);

    return Object.fromEntries(migratedData);
}


// Helper functions
// Return a map of connection name to UUID
async function getConnectionNameToUuid() {
    const connectionPaths = await listNetworkManagerConnectionPaths();
    const connectionSettings = await Promise.all(connectionPaths.map(getNetworkManagerConnectionSettings));
    const connectionNameToUuid = new Map();
    for (const settings of connectionSettings) {
        const connection = settings?.connection;
        const connectionName = connection?.id;
        const connectionUuid = connection?.uuid;
        if (connectionName && connectionUuid) {
            if (connectionNameToUuid.has(connectionName)) {
                // This name has already been seen. We can't know which UUID is correct. Put `undefined` as the value,
                // so when it's checked later, the name won't map to any UUID.
                // Log the previous UUID if applicable
                const previousUuid = connectionNameToUuid.get(connectionName);
                if (previousUuid) {
                    console.warn(`Multiple UUIDs for NetworkManager connection name ${connectionName}: ` +
                        `${previousUuid}. This may later be logged as 'Unable to find UUID'...`);
                }
                // Always log this UUID
                console.warn(`Multiple UUIDs for NetworkManager connection name ${connectionName}: ` +
                    `${connectionUuid}. This may later be logged as 'Unable to find UUID'...`);
                connectionNameToUuid.set(connectionName, undefined);
            } else
                connectionNameToUuid.set(connectionName, connectionUuid);
        }
    }
    return connectionNameToUuid;
}

function listNetworkManagerConnectionPaths() {
    const networkManagerBusName = 'org.freedesktop.NetworkManager';
    const networkManagerSettingsObjectPath = '/org/freedesktop/NetworkManager/Settings';
    const networkManagerSettingsInterface = 'org.freedesktop.NetworkManager.Settings';

    return new Promise((resolve, reject) => {
        Gio.DBus.system.call(
            networkManagerBusName,
            networkManagerSettingsObjectPath,
            networkManagerSettingsInterface,
            'ListConnections',
            null,
            new GLib.VariantType('(ao)'),
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
    const networkManagerBusName = 'org.freedesktop.NetworkManager';
    const networkManagerConnectionInterface = 'org.freedesktop.NetworkManager.Settings.Connection';

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
