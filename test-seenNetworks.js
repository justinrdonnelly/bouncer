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



const loop = GLib.MainLoop.new(null, false);
loop.run();
