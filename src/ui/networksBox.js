/* networksBox.js
 *
 * Copyright 2026 Justin Donnelly
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * SPDX-License-Identifier: MPL-2.0
 */

import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';

export const NetworksBox = GObject.registerClass(
    {
        GTypeName: 'NetworksBox',
        Template: 'resource:///io/github/justinrdonnelly/bouncer/ui/networksBox.ui',
    },
    class NetworksBox extends Gtk.Box {

        constructor() {
            super();
            console.log('Manage zones!');
        }
    }
);
