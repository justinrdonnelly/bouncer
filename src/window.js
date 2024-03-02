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

import Adw from 'gi://Adw';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';

export const ZoneDefenseWindow = GObject.registerClass({
    GTypeName: 'ZoneDefenseWindow',
    Template: 'resource:///com/github/justinrdonnelly/ZoneDefense/window.ui',
    InternalChildren: ['currentZone', 'defaultZone', 'network', 'zoneDropDown', 'zoneList'],
}, class ZoneDefenseWindow extends Adw.ApplicationWindow {
    constructor(application, connectionId, defaultZone, currentZone, zones) {
        super({ application });
        // console.log('window.js');
        // console.log(`application: ${application}`);
        // console.log(`connectionId: ${connectionId}`);
        // console.log(`zones: ${zones}`);
        // console.log(`defaultZone: ${defaultZone}`);
        // console.log(`currentZone: ${currentZone}`);
        this._currentZone.subtitle = currentZone || '[DEFAULT]';
        this._defaultZone.subtitle = defaultZone;
        this._network.subtitle = connectionId;
        zones.forEach(zone => this._zoneList.append(zone));
    }
    chooseButtonClicked(_button) {
        console.log('Choose button clicked!');
        const selectedItemNumber = this._zoneDropDown.get_selected();
        const selectedItemValue = this._zoneDropDown.get_selected_item().get_string();
        console.log(`zone number: ${selectedItemNumber} selected!`);
        console.log(`zone value: ${selectedItemValue} selected!`);
    }
    exitButtonClicked(_button) {
        console.log('Exit button clicked!');
    }
});

