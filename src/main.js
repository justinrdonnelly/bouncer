/* main.js
 *
 * Copyright 2024 Justin Donnelly
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * SPDX-License-Identifier: MPL-2.0
 */

import Adw from 'gi://Adw?version=1';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GLibUnix from 'gi://GLibUnix';
import GObject from 'gi://GObject';

import { NetworkState } from './networkState.js';
import { ConnectionIdsSeen } from './connectionIdsSeen.js';
import { ZoneDefenseWindow } from './window.js';
import { ZoneForConnection } from './zoneForConnection.js';
import { ZoneInfo } from './zoneInfo.js';

pkg.initGettext();
pkg.initFormat();

export const ZoneDefenseApplication = GObject.registerClass(
    class ZoneDefenseApplication extends Adw.Application {
        #sourceIds = [];
        #connectionIdsSeen;

        constructor() {
            super({application_id: 'com.github.justinrdonnelly.ZoneDefense', flags: Gio.ApplicationFlags.DEFAULT_FLAGS});

            console.log("Welcome to Zone Defense! Starting up.");
            this.#connectionIdsSeen = new ConnectionIdsSeen();

            // quit action
            const quit_action = new Gio.SimpleAction({name: 'quit'});
                // eslint-disable-next-line no-unused-vars
                quit_action.connect('activate', action => {
                this.quit();
            });
            this.add_action(quit_action);

            // about action
            const show_about_action = new Gio.SimpleAction({name: 'about'});
            // eslint-disable-next-line no-unused-vars
            show_about_action.connect('activate', action => {
                let aboutParams = {
                    transient_for: this.active_window,
                    application_name: 'zone-defense',
                    application_icon: 'com.github.justinrdonnelly.ZoneDefense',
                    developer_name: 'Justin Donnelly',
                    version: '0.1.0',
                    developers: [
                        'Justin Donnelly'
                    ],
                    copyright: '© 2024 Justin Donnelly'
                };
                const aboutWindow = new Adw.AboutWindow(aboutParams);
                aboutWindow.present();
            });
            this.add_action(show_about_action);

            // handle signals
            const signals = [2, 15];
            signals.forEach((signal) => {
                const gsourceSignal = GLibUnix.signal_source_new(signal);
                gsourceSignal.set_callback(() => {this.quit(signal);});
                this.#sourceIds.push(gsourceSignal.attach(null));
            });

            // fire and forget
            this.init()
              .catch(e => {
                console.error('Unhandled error in main init. This is a bug!');
                console.error(e);
              });
        } // end constructor

        // The init method will instantiate NetworkState and listen for its signals. We do this outside the constructor
        // so we can be async.
        async init() {
            try {
            await this.#connectionIdsSeen.init();
            } catch (e) {
                // Bail out here... There's nothing we can reasonably do without knowing if a network has been seen.
                console.error('Unable to initialize ConnectionIdsSeen.');
                console.error(e.message);
                // TODO: It'd be nice to generate a notification in this case.
                this.quit(null);
            }

            // Create the `connectionChangedAction` action and pass it to NetworkState.
            try {
                const connectionChangedAction = new Gio.SimpleAction({
                    name: 'connectionChangedAction',
                    parameter_type: new GLib.VariantType('as'),
                });

                connectionChangedAction.connect('activate', async (action, parameter) => {
                    try {
                        const parameters = parameter.deepUnpack();
                        console.log(`${action.name} parameters: ${parameters}`);
                        const connectionId = parameters[0];
                        const activeConnectionSettings = parameters[1];
                        this.closeWindowIfConnectionChanged(connectionId);
                        // bail out if there is no connection
                        if (connectionId === '')
                            return;

                        const isConnectionNew = this.#connectionIdsSeen.isConnectionNew(connectionId);
                        if (!isConnectionNew) // The connection is not new. Don't open the window.
                            return;

                        const [zones, defaultZone, currentZone] = await Promise.all([
                            ZoneInfo.getZones(),
                            ZoneInfo.getDefaultZone(),
                            ZoneForConnection.getZone(activeConnectionSettings),
                        ]);
                        this.createWindow(connectionId, defaultZone, currentZone, zones, activeConnectionSettings);
                    } catch (e) {
                        // We've hit an exception in the callback where we'd consider opening the window. Bail out and
                        // hope for better luck next time (unlikely).
                        console.error('Unable to get zone information.');
                        console.error(e.message);
                        // TODO: Is it worth checking to see if firewalld is running? It can help give a more useful error message.
                        // TODO: handle error (maybe show a modal or notification?)
                    }
                });

                this.networkState = new NetworkState(connectionChangedAction);
            } catch (e) {
                // Bail out here... There's nothing we can do without NetworkState.
                console.error('Unable to initialize NetworkState.');
                console.error(e.message);
                // TODO: It'd be nice to generate a notification in this case.
                this.quit(null);
            }
        } // end init

        vfunc_activate() {} // Required because Adw.Application extends GApplication.

        createWindow(connectionId, defaultZone, currentZone, zones, activeConnectionSettings) {
            let {active_window} = this;

            // active_window should always be null. Either this is the first creation, or we should have already called
            // closeWindowIfConnectionChanged.
            if (!active_window)
                active_window = new ZoneDefenseWindow(this, connectionId, defaultZone, currentZone, zones, activeConnectionSettings);

            active_window.present();
        }

        closeWindowIfConnectionChanged(connectionId) {
            let {active_window} = this;
            if (active_window?.connectionId !== connectionId)
                active_window?.close();
        }

        async chooseClicked(connectionId, activeConnectionSettings, zone) {
            console.log(`For connection ID ${connectionId}, setting zone to ${zone ?? ZoneDefenseWindow.defaultZoneLabel}`);
            // Even though these are both async, do NOT execute them concurrently. Update seen connections before updating
            // the zone. If the connection ID hasn't been added to the list of seen connections when the zone is changed,
            // the window will open again!
            // Don't try/catch here. We'll let the exception propagate.
            this.#connectionIdsSeen.addConnectionIdToSeen(connectionId);
            await ZoneForConnection.setZone(activeConnectionSettings, zone);
        }

        quit(signal) {
            if (signal !== null)
                console.log(`quitting due to signal ${signal}!`);
            this.#sourceIds.forEach((id) => GLib.Source.remove(id));
            this.networkState?.destroy()
            this.networkState = null;
            super.quit(); // this ends up calling vfunc_shutdown()
        }
    }
);

export function main(argv) {
    const application = new ZoneDefenseApplication();
    application.hold();
    return application.runAsync(argv);
}
