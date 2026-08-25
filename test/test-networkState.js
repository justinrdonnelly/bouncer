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

import { NetworkState } from '../src/networkState.js';

const networkState = new NetworkState();
networkState.connect('connection-changed', (
    // eslint-disable-next-line no-unused-vars
    emittingObject,
    activeConnection,
    connectionUuid,
    connectionName,
    activeConnectionSettings
) => {
    console.log(`activeConnection: ${activeConnection}`);
    console.log(`connectionUuid: ${connectionUuid}`);
    console.log(`connectionName: ${connectionName}`);
    console.log(`activeConnectionSettings: ${activeConnectionSettings}`);
});

const loop = GLib.MainLoop.new(null, false);

setTimeout(() => {
    networkState.destroy();
    loop.quit();
}, 1000);

loop.run();
