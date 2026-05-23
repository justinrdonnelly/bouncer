/* dashboard.js
 *
 * Copyright 2026 Justin Donnelly
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * SPDX-License-Identifier: MPL-2.0
 */

import Adw from 'gi://Adw';
import GObject from 'gi://GObject';

export const Dashboard = GObject.registerClass(
    {
        GTypeName: 'Dashboard',
        Template: 'resource:///io/github/justinrdonnelly/bouncer/ui/dashboard.ui',
        InternalChildren: ['dependencyBox', 'splitView'],
    },
    class Dashboard extends Adw.ApplicationWindow {
        content = null;

        constructor(application, dependencyBox) {
            super({ application });
            console.debug('Building dashboard window.');
            this.content = dependencyBox;
            this._dependencyBox.append(dependencyBox);
        }

        sidebarActivatedCallback() {
            this._splitView.set_show_content(true);
        }
    }
);
