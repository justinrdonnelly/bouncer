/* dependencyBox.js
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
import Gtk from 'gi://Gtk?version=4.0';

import { DependencyItem } from './dependencyItem.js';

export const DependencyBox = GObject.registerClass(
    {
        GTypeName: 'DependencyBox',
        Template: 'resource:///io/github/justinrdonnelly/bouncer/ui/dependencyBox.ui',
        InternalChildren: ['listBox', 'monitoringRow', 'monitorButton'],
        Signals: {
            'monitor-network': {},
        },
    },
    // eslint-disable-next-line no-shadow
    class DependencyBox extends Gtk.Box {
        #monitoring;
        #statusOverall;

        constructor(dependencyCheck, monitoring) {
            super();
            this.#monitoring = monitoring;
            let count = 0;
            let dependencyItem;
            const buttonSizeGroup = new Gtk.SizeGroup({
                mode: Gtk.SizeGroupMode.HORIZONTAL,
            });

            // D-Bus
            dependencyItem = new DependencyItem(
                ('D-Bus'),
                dependencyCheck,
                'status-dbus',
                async () => {
                    try {
                        // also call dbusListNames to reflect any changes made
                        await dependencyCheck.dbusListNames();
                        await dependencyCheck.checkListNames(false);
                    // eslint-disable-next-line no-empty
                    } catch {}
                },
                {
                    buttonSizeGroup,
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
                },
                {
                    buttonSizeGroup,
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
                },
                {
                    buttonSizeGroup,
                }
            );
            this._listBox.insert(dependencyItem, count++);

            // NetworkManager Permissions
            dependencyItem = new DependencyItem(
                _('NetworkManager Permissions'),
                dependencyCheck,
                'status-network-manager-permissions',
                async () => dependencyCheck.checkNetworkManagerPermissions(false).catch(() => {}),
                {
                    buttonSizeGroup,
                    buttonSensitiveProperty: 'status-network-manager-running',
                    buttonSensitiveTransformFunction: (status) => dependencyCheck.checkComponentStatus(status),
                }
            );
            this._listBox.insert(dependencyItem, count++);

            // Run on startup
            dependencyItem = new DependencyItem(
                _('Run on Startup'),
                dependencyCheck,
                'status-startup',
                async () => dependencyCheck.runOnStartup(false).catch(() => {}),
                {
                    buttonLabel: _('Enable'),
                    buttonSizeGroup,
                    buttonSensitiveProperty: 'can-enable-startup',
                }
            );
            // We'll increment count here even though it's not currently used again. Just follow the pattern.
            // eslint-disable-next-line no-useless-assignment
            this._listBox.insert(dependencyItem, count++);

            // when the dependencyCheck status-overall property changes, update the "monitor" portion
            const statusOverallHandlerId = dependencyCheck.connect(
                'notify::status-overall',
                // eslint-disable-next-line no-unused-vars
                (object, _pspec) => {
                    // we could bind #statusOverall directly, but we'd still need to listen to the
                    // 'notify::status-overall' signal so we can call #handleMonitoringRow
                    this.#statusOverall = object.statusOverall;
                    this.#handleMonitoringRow();
                }
            );
            this.connect('destroy', () => {
                dependencyCheck.disconnect(statusOverallHandlerId);
            });
            this.#statusOverall = dependencyCheck['status-overall'];
            this.#handleMonitoringRow();
        } // end constructor

        #handleMonitoringRow() {
            console.log('Updating dashboard monitoring row');
            if (this.#monitoring) { // already monitoring, disable button and show correct text
                this._monitorButton.sensitive = false;
                this._monitoringRow.subtitle = _('Bouncer is monitoring your Wi-Fi!');
                return;
            }
            // We're not monitoring. Show the correct text.
            this._monitoringRow.subtitle = _('Once everything is ready, click to begin using Bouncer.');
            if (this.#statusOverall) { // overall status is ready to go
                this._monitorButton.sensitive = true;
            } else { // overall status is not ready to go
                this._monitorButton.sensitive = false;
            }
        }

        beginMonitoring() {
            console.log('Dashboard now knows Bouncer is monitoring');
            this.#monitoring = true;
            this.#handleMonitoringRow();
        }

        // eslint-disable-next-line no-unused-vars
        async monitorButtonClicked(_button) {
            console.log('Beginning monitoring from dashboard');
            this.emit('monitor-network');
        }

    }
);
