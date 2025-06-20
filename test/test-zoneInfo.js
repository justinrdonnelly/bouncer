/* test-zoneInfo.js
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

import { ZoneInfo } from '../src/zoneInfo.js';

async function getZoneInformation() {
    try {
        // Any firewalld dbus failures are considered fatal
        const [zones, defaultZone] = await Promise.all([ZoneInfo.getZones(), ZoneInfo.getDefaultZone()]);
        console.log('promises!');
        console.log(`zones: ${zones}`);
        console.log(`defaultZone: ${defaultZone}`);
    } catch (e) {
        console.log('error');
        console.log(e);
    }
}

getZoneInformation();

const loop = GLib.MainLoop.new(null, false);

setTimeout(() => {
    loop.quit();
}, 1000);

loop.run();
