/* dashboardWindow.js
 *
 * Copyright 2025 Justin Donnelly
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * SPDX-License-Identifier: MPL-2.0
 */

import GObject from 'gi://GObject';
import Adw from 'gi://Adw';

export const DashboardWindow = GObject.registerClass({
    GTypeName: 'DashboardWindow',
    Template: 'resource:///io/github/justinrdonnelly/bouncer/dashboardWindow.ui',
    InternalChildren: ['label'],
}, class DashboardWindow extends Adw.ApplicationWindow {
    constructor(application) {
        super({ application });
    }
});

