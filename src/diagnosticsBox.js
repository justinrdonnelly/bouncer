/* diagnosticsBox.js
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
import Gtk from 'gi://Gtk';

import { DiagnosticsItem } from './diagnosticsItem.js';

export const DiagnosticsBox = GObject.registerClass({
    GTypeName: 'DiagnosticsBox',
    Template: 'resource:///io/github/justinrdonnelly/bouncer/diagnosticsBox.ui',
    InternalChildren: ['listBox'],
}, class DiagnosticsBox extends Gtk.Box {
    constructor(dependencyCheck) {
        super();
        let count = 0;
        let diagnosticsItem;

        // D-Bus
        diagnosticsItem = new DiagnosticsItem(
            _('D-Bus'),
            dependencyCheck,
            'status-dbus',
            async () => {
                try {
                    // also call dbusListNames to reflect any changes made
                    await dependencyCheck.dbusListNames();
                    await dependencyCheck.checkListNames();
                } catch {;}
            }
        );
        this._listBox.insert(diagnosticsItem, count++);

        // firewalld Running
        diagnosticsItem = new DiagnosticsItem(
            _('firewalld Running'),
            dependencyCheck,
            'status-firewalld-running',
            async () => {
                try {
                    // also call dbusListNames to reflect any changes made
                    await dependencyCheck.dbusListNames();
                    await dependencyCheck.checkFirewalld();
                } catch {;}
            }
        );
        this._listBox.insert(diagnosticsItem, count++);

        // NetworkManager Running
        diagnosticsItem = new DiagnosticsItem(
            _('NetworkManager Running'),
            dependencyCheck,
            'status-network-manager-running',
            async () => {
                try {
                    // also call dbusListNames to reflect any changes made
                    await dependencyCheck.dbusListNames();
                    await dependencyCheck.checkNetworkManagerRunning();
                } catch {;}
            }
        );
        this._listBox.insert(diagnosticsItem, count++);

        // NetworkManager Permissions
        diagnosticsItem = new DiagnosticsItem(
            _('NetworkManager Permissions'),
            dependencyCheck,
            'status-network-manager-permissions',
            async () => dependencyCheck.checkNetworkManagerPermissions().catch(() => {})
        );
        this._listBox.insert(diagnosticsItem, count++);

        // NetworkManager Running
        diagnosticsItem = new DiagnosticsItem(
            _('Run on Startup'),
            dependencyCheck,
            'status-startup',
            async () => dependencyCheck.runOnStartup().catch(() => {})
        );
        this._listBox.insert(diagnosticsItem, count++);
    }

    // eslint-disable-next-line no-unused-vars
    async monitorButtonClicked(_button) {
        console.log('HERE');
    }

});
