/* dashboardBox.js
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

import { DependencyItem } from './dependencyItem.js';

export const DashboardBox = GObject.registerClass({
    GTypeName: 'DashboardBox',
    Template: 'resource:///io/github/justinrdonnelly/bouncer/dashboardBox.ui',
    InternalChildren: ['listBox', 'monitorButton'],
}, class DashboardBox extends Gtk.Box {
    constructor(dependencyCheck) {
        super();
        let count = 0;
        let dependencyItem;

        // D-Bus
        dependencyItem = new DependencyItem(
            _('D-Bus'),
            dependencyCheck,
            'status-dbus',
            async () => {
                try {
                    // also call dbusListNames to reflect any changes made
                    await dependencyCheck.dbusListNames();
                    await dependencyCheck.checkListNames(false);
                // eslint-disable-next-line no-empty
                } catch {}
            }
        );
        this._listBox.insert(dependencyItem, count++);

        // firewalld Running
        dependencyItem = new DependencyItem(
            _('firewalld Running'),
            dependencyCheck,
            'status-firewalld-running',
            async () => {
                try {
                    // also call dbusListNames to reflect any changes made
                    await dependencyCheck.dbusListNames();
                    await dependencyCheck.checkFirewalld(false);
                // eslint-disable-next-line no-empty
                } catch {}
            }
        );
        this._listBox.insert(dependencyItem, count++);

        // NetworkManager Running
        dependencyItem = new DependencyItem(
            _('NetworkManager Running'),
            dependencyCheck,
            'status-network-manager-running',
            async () => {
                try {
                    // also call dbusListNames to reflect any changes made
                    await dependencyCheck.dbusListNames();
                    await dependencyCheck.checkNetworkManagerRunning(false);
                // eslint-disable-next-line no-empty
                } catch {}
            }
        );
        this._listBox.insert(dependencyItem, count++);

        // NetworkManager Permissions
        dependencyItem = new DependencyItem(
            _('NetworkManager Permissions'),
            dependencyCheck,
            'status-network-manager-permissions',
            async () => dependencyCheck.checkNetworkManagerPermissions(false).catch(() => {})
        );
        this._listBox.insert(dependencyItem, count++);

        // NetworkManager Running
        dependencyItem = new DependencyItem(
            _('Run on Startup'),
            dependencyCheck,
            'status-startup',
            async () => dependencyCheck.runOnStartup(false).catch(() => {})
        );
        this._listBox.insert(dependencyItem, count++);

        // bind button sensitive (enabled) to dependencyCheck
        dependencyCheck.bind_property(
            'status-overall',
            this._monitorButton,
            'sensitive',
            GObject.BindingFlags.SYNC_CREATE
        );
    }

    // eslint-disable-next-line no-unused-vars
    async monitorButtonClicked(_button) {
        console.log('HERE');
    }

});
