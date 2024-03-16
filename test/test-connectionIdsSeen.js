/* test-connectionIdsSeen.js
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
import {ConnectionIdsSeen} from '../src/connectionIdsSeen.js';

const connectionIdsSeen = new ConnectionIdsSeen();
test();

async function test() {
    try {
        const connectionId = 'Starbucks';
        let connectionIdIsNew = await connectionIdsSeen.isConnectionNew(connectionId);
        console.log(`new: ${connectionIdIsNew}`);
        console.log(`adding connectionId: ${connectionId}`);
        await connectionIdsSeen.addConnectionIdToSeen(connectionId);
        connectionIdIsNew = await connectionIdsSeen.isConnectionNew(connectionId);
        console.log(`new: ${connectionIdIsNew}`);
    } catch (e) {
        console.log('error in test');
        console.log(e);
    }
}


const loop = GLib.MainLoop.new(null, false);
loop.run();
