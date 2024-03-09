/* test-networkState.js
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
import {NetworkState} from './src/networkState.js';

const networkState = new NetworkState();

setTimeout(() => {
    // console.log(`networkManager: ${networkState.networkManager}`);
    // console.log(`networkDevices: ${networkState.networkManager.networkDevices}`);
    const devices = networkState.networkManager.networkDevices;
    devices.forEach(device => {
        // console.log(`Connection: ${device.connection}`);
        console.log(`Connection ID: ${device.connection.activeConnectionId}`);
        console.log(`Settings object path: ${device.connection.activeConnectionSettings}`);
    });
}, 1000);

// simulate disabling the extension
setTimeout(() => {
    networkState.destroy();
}, 2000);

const loop = GLib.MainLoop.new(null, false);
loop.run();
