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

import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk?version=4.0';
import Adw from 'gi://Adw?version=1';

import { ZoneDefenseWindow } from './window.js';

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
        } // end constructor

        vfunc_activate() {
            let {active_window} = this;

            if (!active_window)
                active_window = new ZoneDefenseWindow(this);

            active_window.present();
        }
    }
);

export function main(argv) {
    const application = new ZoneDefenseApplication();
    return application.runAsync(argv);
}
