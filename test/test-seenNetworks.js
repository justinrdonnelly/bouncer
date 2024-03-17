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
import {SeenNetworks} from '../src/seenNetworks.js';

const seenNetworks = new SeenNetworks();
test();

async function test() {
    try {
        const network = 'Starbucks';
        let networkIsNew = await seenNetworks.isNetworkNew(network);
        console.log(`new: ${networkIsNew}`);
        console.log(`adding network: ${network}`);
        await seenNetworks.addNetworkToSeen(network);
        networkIsNew = await seenNetworks.isNetworkNew(network);
        console.log(`new: ${networkIsNew}`);
    } catch (e) {
        console.log('error in test');
        console.log(e);
    }
}


const loop = GLib.MainLoop.new(null, false);
loop.run();
