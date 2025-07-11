/* test-zoneForConnection.js
 *
 * Copyright 2024 Justin Donnelly
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * SPDX-License-Identifier: MPL-2.0
 */

import GLib from 'gi://GLib';

import { ZoneForConnection } from '../src/zoneForConnection.js';

/**
 *
 * @param {string} objectPath - The object path of the configuration/settings to update.
 */
// eslint-disable-next-line no-unused-vars
async function getZone(objectPath) {
    try {
        const zone = await ZoneForConnection.getZone(objectPath);
        console.log(`zone: ${zone}`);
    } catch (e) {
        console.log('error - outermost catch');
        console.log(e);
    }
}

/**
 *
 * @param {string} objectPath - The object path of the configuration/settings to update.
 */
async function updateZone(objectPath) {
    let zone;
    let newZone;
    try {
        zone = await ZoneForConnection.getZone(objectPath);
        console.log(`zone before: ${zone}`);
        if (zone === 'trusted')
            newZone = 'public';
        else
            newZone = 'trusted';
        await ZoneForConnection.setZone(objectPath, newZone);
        zone = await ZoneForConnection.getZone(objectPath);
        console.log(`zone after: ${zone}`);
    } catch (e) {
        console.log('error - outermost catch');
        console.log(e);
    }
}

// Settings/5 is the NM configuration settings for the wireless connection I am using for testing.
// Normally, this object path would have to come from networkState.js

// getZone('/org/freedesktop/NetworkManager/Settings/5');
updateZone('/org/freedesktop/NetworkManager/Settings/5');

const loop = GLib.MainLoop.new(null, false);

setTimeout(() => {
    loop.quit();
}, 1000);

loop.run();
