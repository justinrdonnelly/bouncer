/* window.js
 *
 * Copyright 2024 Justin Donnelly
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
    InternalChildren: ['currentZone', 'defaultZone', 'connectionId', 'zoneDropDown', 'zoneList'],
}, class ZoneDefenseWindow extends Adw.ApplicationWindow {
    static #simpleZoneList = ['public', 'home', 'work'];
    static #defaultZoneLabel = '[DEFAULT]';
    #connectionId;
    #application;
    #activeConnectionSettings;

    constructor(application, connectionId, defaultZone, currentZone, allZones, activeConnectionSettings) {
        super({ application });
        // console.log('window.js');
        // console.log(`application: ${application}`);
        // console.log(`connectionId: ${connectionId}`);
        // console.log(`allZones: ${allZones}`);
        // console.log(`defaultZone: ${defaultZone}`);
        // console.log(`currentZone: ${currentZone}`);
        this.#connectionId = connectionId;
        this.#application = application;
        this.#activeConnectionSettings = activeConnectionSettings;
        this._currentZone.subtitle = currentZone || ZoneDefenseWindow.#defaultZoneLabel;
        this._defaultZone.subtitle = defaultZone;
        this._connectionId.subtitle = connectionId;

        let selected = null;
        const zones = this.generateZoneList(allZones, defaultZone, currentZone);
        this._zoneList.append(ZoneDefenseWindow.#defaultZoneLabel); // show the default first in the list
        if (currentZone === null) // null means default zone
            selected = 0;
        zones.forEach((zone, idx) => {
            this._zoneList.append(zone);
            if (zone === currentZone)
                selected = idx + 1; // index 0 is the default zone, and was added before we started the loop
        });
        this._zoneDropDown.set_selected(selected);
        this._zoneDropDown.grab_focus();
    }

    // By default, we want to keep things simple for the user. See table for behavior. Later we may make this configurable.
    /**
    *        Simple zones all exist
    *       /    Default zone in #simpleZoneList
    *      /    /    Current zone in #simpleZoneList
    *     /    /    /
    * | SZE | DS | CS | Result                     |
    * | --- | -- | -- | -------------------------- |
    * |   F |  F |  F | All zones                  |
    * |   F |  F |  T | All zones                  |
    * |   F |  T |  F | All zones                  |
    * |   F |  T |  T | All zones                  |
    * |   T |  F |  F | Simple + Default + Current |
    * |   T |  F |  T | Simple + Default           |
    * |   T |  T |  F | Simple + Current           |
    * |   T |  T |  T | Simple                     |
    */
    generateZoneList(allZones, defaultZone, currentZone) {
        const simpleZonesExist = ZoneDefenseWindow.#simpleZoneList.every(z => allZones.includes(z));
        if (!simpleZonesExist)
            return allZones;
        const zones = [...ZoneDefenseWindow.#simpleZoneList];
        // console.log(zones);
        const defaultZoneSimple = ZoneDefenseWindow.#simpleZoneList.includes(defaultZone);
        const currentZoneSimple = ZoneDefenseWindow.#simpleZoneList.includes(currentZone);
        // console.log(`default simple: ${defaultZoneSimple}`);
        // console.log(`current simple: ${currentZoneSimple}`);
        if (!defaultZoneSimple)
            zones.push(defaultZone);
        console.log(`currentZone: ${currentZone}`);
        if (currentZone && !currentZoneSimple)
            zones.push(currentZone);
        return zones.sort();
    }

    async chooseButtonClicked(_button) {
        console.log('Choose button clicked!');
        const selectedItemNumber = this._zoneDropDown.get_selected();
        let selectedItemValue = this._zoneDropDown.get_selected_item().get_string();
        console.log(`zone number: ${selectedItemNumber} selected!`);
        console.log(`zone value: ${selectedItemValue} selected!`);
        if (selectedItemValue === ZoneDefenseWindow.#defaultZoneLabel)
            selectedItemValue = null; // default zone is represented by null
        try {
            // TODO: Should I be using signals/actions here instead of using a reference to main and calling a method? I need to know about errors.
            await this.#application.chooseClicked(this.#connectionId, this.#activeConnectionSettings, selectedItemValue);
            this.close();
        } catch (error) { // TODO: handle error (maybe show something on the window?)
            console.log('error');
            console.log(error);
        }

    }

    exitButtonClicked(_button) {
        console.log('Exit button clicked!');
        this.close();
    }
});

