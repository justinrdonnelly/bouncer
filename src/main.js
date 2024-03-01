/* main.js
 *
 * Copyright 2024 Justin
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
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=4.0';

import { NetworkState } from './networkState.js';
import { ZoneDefenseWindow } from './window.js';
import { ZoneForConnection } from './zoneForConnection.js';
import { ZoneInfo } from './zoneInfo.js';

pkg.initGettext();
pkg.initFormat();

export const ZoneDefenseApplication = GObject.registerClass(
    class ZoneDefenseApplication extends Adw.Application {
        constructor() {
            super({application_id: 'com.github.justinrdonnelly.ZoneDefense', flags: Gio.ApplicationFlags.DEFAULT_FLAGS});

            const quit_action = new Gio.SimpleAction({name: 'quit'});
                quit_action.connect('activate', action => {
                this.quit();
            });
            this.add_action(quit_action);
            this.set_accels_for_action('app.quit', ['<primary>q']);

            const show_about_action = new Gio.SimpleAction({name: 'about'});
            show_about_action.connect('activate', action => {
                let aboutParams = {
                    transient_for: this.active_window,
                    application_name: 'zone-defense',
                    application_icon: 'com.github.justinrdonnelly.ZoneDefense',
                    developer_name: 'Justin',
                    version: '0.1.0',
                    developers: [
                        'Justin'
                    ],
                    copyright: '© 2024 Justin'
                };
                const aboutWindow = new Adw.AboutWindow(aboutParams);
                aboutWindow.present();
            });
            this.add_action(show_about_action);

            const networkChangedAction = new Gio.SimpleAction({
                name: 'networkChangedAction',
                parameter_type: new GLib.VariantType('as'),
            });

            networkChangedAction.connect('activate', async (action, parameter) => {
                console.log(`${action.name} activated: ${parameter.deepUnpack()}`);
                const parameters = parameter.deepUnpack();
                const connectionId = parameters[0];
                const activeConnectionSettings = parameters[1];
                console.log(`connectionId: ${connectionId}`);
                console.log(`activeConnectionSettings: ${activeConnectionSettings}`);

                try {
                    // Any firewalld dbus failures are considered fatal
                    const [zones, defaultZone, zoneOfConnection] = await Promise.all([
                        ZoneInfo.getZones(),
                        ZoneInfo.getDefaultZone(),
                        ZoneForConnection.getZone(activeConnectionSettings),
                    ]);
                    // console.log('promises!');
                    // console.log(`zones: ${zones}`);
                    // console.log(`defaultZone: ${defaultZone}`);
                    // console.log(`zoneOfConnection: ${zoneOfConnection}`);
                    // TODO: work the default zone and currently selected zone into this
                    this.createWindow(connectionId, zoneOfConnection, zones);
                } catch (error) {
                    console.error(error);
                    // TODO: Is it worth checking to see if firewalld is running? It can help give a more useful error message.
                }
            });

            this.networkState = new NetworkState(networkChangedAction);

            // handle signals
            const gsourceSigint = GLib.unix_signal_source_new(2);
            const gsourceSigterm = GLib.unix_signal_source_new(15);
            gsourceSigint.set_callback(() => {this.quit(2);});
            gsourceSigterm.set_callback(() => {this.quit(15);});
            this.sourceIdSigint = gsourceSigint.attach(null);
            this.sourceIdSigterm = gsourceSigterm.attach(null);
        } // end constructor

        vfunc_activate() {} // We get a warning if this method does not exist.

        createWindow(connectionId, zoneOfConnection, zones) {
            let {active_window} = this;

            if (!active_window)
                active_window = new ZoneDefenseWindow(this, connectionId, zones);

            active_window.present();
        }

        quit(signal) {
            console.log(`quitting due to signal ${signal}!`);
            GLib.Source.remove(this.sourceIdSigint);
            GLib.Source.remove(this.sourceIdSigterm);
            this.networkState.destroy()
            this.networkState = null;
            console.log('here');
            super.quit(); // this ends up calling vfunc_shutdown()
        }
    }
);

export function main(argv) {
    const application = new ZoneDefenseApplication();
    application.hold();
    return application.runAsync(argv);
}
