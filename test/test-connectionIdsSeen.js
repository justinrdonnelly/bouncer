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

import { ConnectionIdsSeen } from '../src/connectionIdsSeen.js';

import promisify from '../src/promisify.js';

// When testing locally, the file will be saved in: $HOME/.local/share/bouncer/connection-ids-seen.json

promisify();
const connectionIdsSeen = new ConnectionIdsSeen();

test();

async function test() {
    try {
        await connectionIdsSeen.init();
        const connectionName = 'Starbucks';
        let connectionIdIsNew = connectionIdsSeen.isConnectionNew(connectionName);
        console.log(`new: ${connectionIdIsNew}`);
        console.log(`adding connectionName: ${connectionName}`);
        connectionIdsSeen.addConnectionIdToSeen(connectionName);
        connectionIdIsNew = connectionIdsSeen.isConnectionNew(connectionName);
        console.log(`new: ${connectionIdIsNew}`);
    } catch (e) {
        console.error('error in test');
        console.error(e);
    }
}

const loop = GLib.MainLoop.new(null, false);

setTimeout(() => {
    loop.quit();
}, 1000);

loop.run();
