/* chooseZoneBox.js
 *
 * Copyright 2024 Justin Donnelly
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * SPDX-License-Identifier: MPL-2.0
 */

import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';

import { MoreInfoDialog } from './moreInfo.js';
import { getSelectedZone, getZoneDisplayName, populateZoneList } from '../zoneSelection.js';

export const ChooseZoneBox = GObject.registerClass(
    {
        GTypeName: 'ChooseZoneBox',
        Template: 'resource:///io/github/justinrdonnelly/bouncer/ui/chooseZoneBox.ui',
        InternalChildren: ['currentZone', 'defaultZone', 'connectionName', 'zoneDropDown', 'zoneList'],
        Signals: {
            'zone-selected': {
                param_types: [
                    GObject.TYPE_STRING, // connectionUuid
                    GObject.TYPE_STRING, // connectionName
                    GObject.TYPE_STRING, // activeConnectionSettings
                    GObject.TYPE_STRING, // zone
                    GObject.TYPE_STRING, // defaultZone
                ],
            },
        },
    },
    class ChooseZoneBox extends Gtk.Box {
        #connectionUuid;
        #connectionName;
        #defaultZone;
        #activeConnectionSettings;
        window;

        constructor(connectionUuid, connectionName, defaultZone, currentZone, allZones, activeConnectionSettings) {
            super();
            console.debug('Building window.');
            console.debug(`connectionUuid: ${connectionUuid}`);
            console.debug(`connectionName: ${connectionName}`);
            console.debug(`allZones: ${allZones}`);
            console.debug(`defaultZone: ${defaultZone}`);
            console.debug(`currentZone: ${currentZone}`);
            this.#connectionUuid = connectionUuid;
            this.#connectionName = connectionName;
            this.#activeConnectionSettings = activeConnectionSettings;
            this.#defaultZone = defaultZone;
            this._currentZone.subtitle = getZoneDisplayName(currentZone);
            this._defaultZone.subtitle = defaultZone;
            this._connectionName.subtitle = connectionName;

            const selected = populateZoneList(this._zoneList, allZones, defaultZone, currentZone);
            this._zoneDropDown.set_selected(selected);
            this._zoneDropDown.grab_focus();
        }

        // eslint-disable-next-line no-unused-vars
        async chooseButtonClicked(_button) {
            const selectedZone = getSelectedZone(this._zoneDropDown);
            console.log('Zone selected.');
            this.emit(
                'zone-selected',
                this.#connectionUuid,
                this.#connectionName,
                this.#activeConnectionSettings,
                selectedZone,
                this.#defaultZone
            );
            this.window.close();
        }

        // eslint-disable-next-line no-unused-vars
        helpButtonClicked(_button) {
            const moreDialog = new MoreInfoDialog();
            moreDialog.present(this);
        }

        // eslint-disable-next-line no-unused-vars
        exitButtonClicked(_button) {
            console.log('Exiting without selecting a zone.');
            this.window.close();
        }
    }
);
