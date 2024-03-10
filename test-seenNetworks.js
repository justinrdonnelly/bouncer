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
import {SeenNetworks} from './src/seenNetworks.js';

const seenNetworks = new SeenNetworks();
console.log(seenNetworks.seenNetworks); // Is this: 1. A promise; 2. undefined; 3. The real value - Answer: A promise
logSeenNetworks();



async function logSeenNetworks() {
    console.log('in logSeenNetworks');
    try {
        const networks = await seenNetworks.seenNetworks
        console.log(networks); // Is this: 1. A promise; 2. undefined; 3. The real value - Answer: The real value
    } catch (e) {
        console.log('error in test');
        console.log(e);
    }
}


const loop = GLib.MainLoop.new(null, false);
loop.run();
