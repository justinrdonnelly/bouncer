/* window.js
 *
 * Copyright 2024 Justin
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * SPDX-License-Identifier: MPL-2.0
 */

import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';

export const ZoneDefenseWindow = GObject.registerClass({
    GTypeName: 'ZoneDefenseWindow',
    Template: 'resource:///com/github/justinrdonnelly/ZoneDefense/window.ui',
    InternalChildren: ['networkLabel'],
}, class ZoneDefenseWindow extends Adw.ApplicationWindow {
    constructor(application, connectionId) {
        super({ application });
        this._networkLabel.label = `<span size="x-small">You are connected to: ${connectionId}</span>`;
    }
    chooseButtonClicked(_button) {
        console.log('Choose button clicked!');
    }
    exitButtonClicked(_button) {
        console.log('Exit button clicked!');
    }
});

