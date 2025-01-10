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

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

import { NetworkState } from '../src/networkState.js';

const connectionChangedAction = new Gio.SimpleAction({
    name: 'connectionChangedAction',
    parameter_type: new GLib.VariantType('as'),
});

// eslint-disable-next-line no-unused-vars
connectionChangedAction.connect('activate', (action, parameter) => {
    // console.log(`${action.name} activated: ${parameter.deepUnpack()}`);
    const parameters = parameter.deepUnpack();
    const connectionId = parameters[0];
    const activeConnectionSettings = parameters[1];
    console.log(`connectionId: ${connectionId}`);
    console.log(`activeConnectionSettings: ${activeConnectionSettings}`);
});

const networkState = new NetworkState(connectionChangedAction);
const loop = GLib.MainLoop.new(null, false);

setTimeout(() => {
    networkState.destroy();
    loop.quit();
}, 1000);

loop.run();
