/* chooseZoneWindow.js
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

import { MoreInfoDialog } from './moreInfo.js';

export const ChooseZoneWindow = GObject.registerClass(
    {
        GTypeName: 'ChooseZoneWindow',
        Template: 'resource:///io/github/justinrdonnelly/bouncer/chooseZoneWindow.ui',
        InternalChildren: ['currentZone', 'defaultZone', 'connectionId', 'zoneDropDown', 'zoneList'],
        Signals: {
            'zone-selected': {
                param_types: [
                    GObject.TYPE_STRING, // connectionId
                    GObject.TYPE_STRING, // activeConnectionSettings
                    GObject.TYPE_STRING, // zone
                    GObject.TYPE_STRING, // defaultZone
                ],
            },
        },
    },
    class ChooseZoneWindow extends Adw.ApplicationWindow {
        static #simpleZoneList = ['public', 'home', 'work'];
        static defaultZoneLabel = '[DEFAULT]';
        #connectionId;
        #defaultZone;
        #activeConnectionSettings;

        constructor(application, connectionId, defaultZone, currentZone, allZones, activeConnectionSettings) {
            super({ application });
            console.debug('Building window.');
            console.debug(`application: ${application}`);
            console.debug(`connectionId: ${connectionId}`);
            console.debug(`allZones: ${allZones}`);
            console.debug(`defaultZone: ${defaultZone}`);
            console.debug(`currentZone: ${currentZone}`);
            this.#connectionId = connectionId;
            this.#activeConnectionSettings = activeConnectionSettings;
            this.#defaultZone = defaultZone;
            this._currentZone.subtitle = currentZone || ChooseZoneWindow.defaultZoneLabel;
            this._defaultZone.subtitle = defaultZone;
            this._connectionId.subtitle = connectionId;

            let selected = null;
            const zones = this.#generateZoneList(allZones, defaultZone, currentZone);
            this._zoneList.append(ChooseZoneWindow.defaultZoneLabel); // show the default first in the list
            if (currentZone === null)
                // null means default zone
                selected = 0;
            zones.forEach((zone, idx) => {
                this._zoneList.append(zone);
                if (zone === currentZone)
                    // index 0 is the default zone, and was added before we started the loop
                    selected = idx + 1;
            });
            this._zoneDropDown.set_selected(selected);
            this._zoneDropDown.grab_focus();
        }

        // By default, we want to keep things simple for the user and only show a subset of zones. See table for
        // behavior. Later we may make this configurable.
        /*
         *        Simple zones (#simpleZoneList) all exist
         *       /    Default zone in simple zones
         *      /    /    Current zone in simple zones
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
        #generateZoneList(allZones, defaultZone, currentZone) {
            const simpleZonesExist = ChooseZoneWindow.#simpleZoneList.every((z) => allZones.includes(z));
            if (!simpleZonesExist)
                return allZones;
            const zones = [...ChooseZoneWindow.#simpleZoneList];
            const defaultZoneSimple = ChooseZoneWindow.#simpleZoneList.includes(defaultZone);
            const currentZoneSimple = ChooseZoneWindow.#simpleZoneList.includes(currentZone);
            if (!defaultZoneSimple)
                zones.push(defaultZone);
            if (currentZone && !currentZoneSimple)
                zones.push(currentZone);
            return zones.sort();
        }

        // eslint-disable-next-line no-unused-vars
        async chooseButtonClicked(_button) {
            let selectedItemValue = this._zoneDropDown.get_selected_item().get_string();
            if (selectedItemValue === ChooseZoneWindow.defaultZoneLabel)
                selectedItemValue = null; // default zone is represented by null
            console.log('Zone selected.');
            this.emit(
                'zone-selected',
                this.#connectionId,
                this.#activeConnectionSettings,
                selectedItemValue,
                this.#defaultZone
            );
            this.close();
        }

        // eslint-disable-next-line no-unused-vars
        helpButtonClicked(_button) {
            const moreDialog = new MoreInfoDialog();
            moreDialog.present(this);
        }

        // eslint-disable-next-line no-unused-vars
        exitButtonClicked(_button) {
            console.log('Exiting without selecting a zone.');
            this.close();
        }
    }
);
