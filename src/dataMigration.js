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

export function migrateDataIfNecessary(data, machineId) {
    let migratedData = data;

    migratedData = migrateConnectionIdsFromArrayToObject(migratedData, machineId);

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
