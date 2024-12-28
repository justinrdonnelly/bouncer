/* dependencyCheck.js
 *
 * Copyright 2024 Justin Donnelly
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * SPDX-License-Identifier: MPL-2.0
 */

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Xdp from "gi://Xdp";

export const DependencyCheck = GObject.registerClass({
    Signals: {
        'dependency-error': {
            param_types: [GObject.TYPE_BOOLEAN, GObject.TYPE_STRING, GObject.TYPE_STRING, GObject.TYPE_STRING],
        },
    },
}, class DependencyCheck extends GObject.Object {
    static #XDP_BACKGROUND_FLAG_AUTOSTART = 1; // https://libportal.org/flags.BackgroundFlags.html

    #dbusNames; // A promise that resolves to a list of D-Bus names. Use `await`.

    constructor(constructProperties = {}) {
        super(constructProperties);
        this.dbusListNames();
    }

    dbusListNames() {
        // I can't seem to make this call without a callback (was hoping it would return a promise)
        this.#dbusNames = new Promise((resolve, reject) => {
            Gio.DBus.system.call(
                'org.freedesktop.DBus',
                '/org/freedesktop/DBus',
                'org.freedesktop.DBus',
                'ListNames', // method
                null,
                new GLib.VariantType('(as)'), // reply type
                // might want ALLOW_INTERACTIVE_AUTHORIZATION - https://gjs-docs.gnome.org/gio20/gio.dbuscallflags
                Gio.DBusCallFlags.NONE,
                -1, // timeout
                null, // cancellable
                (connection, res) => {
                    try {
                        const reply = connection.call_finish(res);
                        resolve(reply.get_child_value(0).recursiveUnpack());
                    } catch (e) {
                        if (e instanceof Gio.DBusError)
                            Gio.DBusError.strip_remote_error(e);
                        reject(e);
                    }
                }
            );
        });
    }

    async runChecks() {
        await Promise.all([
            this.runOnStartup(),
            this.checkListNames(),
            this.checkFirewalld(),
            this.checkNetworkManager()
        ]);
    }

    // This is not really a dependency. But we need to run on startup to actually be useful.
    async runOnStartup() {
        try {
            console.log('Configuring autostart');
            const portal = new Xdp.Portal();
            await portal.request_background(
                null,
                'Zone Defense must start on login',
                ['com.github.justinrdonnelly.ZoneDefense'],
                DependencyCheck.#XDP_BACKGROUND_FLAG_AUTOSTART,
                null
            );
            console.log('Successfully configured autostart');
        } catch (e) {
            console.error('Error configuring autostart.');
            console.error(e.message);
            this.emit(
                'dependency-error',
                false,
                'dependency-error-autostart',
                'Can\'t configure autostart',
                'Please make sure the portal is available from inside the flatpak sandbox. Please see logs for more ' +
                    'information.'
            );
        }
    }

    async checkListNames() {
        try {
            await this.#dbusNames;
        } catch (e) {
            console.error('Error awaiting D-Bus names. This is likely a result of the ListNames method call.');
            console.error(e.message)
                this.emit(
                    'dependency-error',
                    true,
                    'dependency-error-names',
                    'Can\'t find D-Bus names',
                    'Please make sure D-Bus is installed, running, and available inside the flatpak sandbox. ' +
                        'Please see logs for more information.'
                );
        }
    }

    async checkFirewalld() {
        // We have already handled any errors with #dbusNames. So we'll swallow those errors here. We wouldn't be able
        // to continue, so we'll just return.
        try {
            await this.#dbusNames;
        } catch (e) {
            console.log('Skipping check for firewalld on DBus due to previous ListNames error.');
            return;
        }

        // confirm firewalld is running
        if ((await this.#dbusNames).includes('org.fedoraproject.FirewallD1'))
            console.log('Found firewalld on D-Bus.');
        else {
            console.error('Didn\'t see firewalld on D-Bus.');
            this.emit(
                'dependency-error',
                true,
                'dependency-error-firewalld',
                'Can\'t find firewalld',
                'Please make sure firewalld is installed, running, and available inside the flatpak sandbox. ' +
                    'Please see logs for more information.'
            );
        }
    }

    async checkNetworkManager() {
        // We have already handled any errors with #dbusNames. So we'll swallow those errors here. We wouldn't be able
        // to continue, so we'll just return.
        try {
            await this.#dbusNames;
        } catch (e) {
            console.log('Skipping check for NetworkManager on DBus due to previous ListNames error.');
            return;
        }

        // confirm NetworkManager is running
        if ((await this.#dbusNames).includes('org.freedesktop.NetworkManager'))
            console.log('Found NetworkManager on D-Bus.');
        else {
            console.error('Didn\'t see NetworkManager on D-Bus.');
            this.emit(
                'dependency-error',
                true,
                'dependency-error-networkmanager',
                'Can\'t find NetworkManager',
                'Please make sure NetworkManager is installed, running, and available inside the flatpak ' +
                    'sandbox. Please see logs for more information.'
            );
        }

        // check NetworkManager permissions
        console.log('Checking NetworkManager permissions.');
        // I can't seem to make this call without a callback (was hoping it would return a promise)
        const permissions = new Promise((resolve, reject) => {
            Gio.DBus.system.call(
                'org.freedesktop.NetworkManager',
                '/org/freedesktop/NetworkManager',
                'org.freedesktop.NetworkManager',
                'GetPermissions', // method
                null,
                new GLib.VariantType('(a{ss})'), // reply type
                // might want ALLOW_INTERACTIVE_AUTHORIZATION - https://gjs-docs.gnome.org/gio20/gio.dbuscallflags
                Gio.DBusCallFlags.NONE,
                -1, // timeout
                null, // cancellable
                (connection, res) => {
                    try {
                        const reply = connection.call_finish(res);
                        resolve(reply.get_child_value(0).recursiveUnpack());
                    } catch (e) {
                        if (e instanceof Gio.DBusError)
                            Gio.DBusError.strip_remote_error(e);
                        reject(e);
                    }
                }
            );
        });
        // GetSettings doesn't require any permissions. Update requires
        // 'org.freedesktop.NetworkManager.settings.modify.system'.
        const modifyPermission = (await permissions)['org.freedesktop.NetworkManager.settings.modify.system'];
        console.log(`NetworkManager modify permission: ${modifyPermission}`);
        switch (modifyPermission) {
            case 'yes': // authorized, without requiring authentication
                console.log('Authentication not required to change NetworkManager connection zone.');
                break;
            case 'auth': // authorized, but requires polkit authentication
                console.warn('Authentication required to change NetworkManager connection zone.');
                this.emit(
                    'dependency-error',
                    false,
                    'dependency-error-networkmanager',
                    'Authentication required to change NetworkManager connection zone',
                    'You are authorized to change the connection zone in NetworkManager, but will be required to ' +
                        'authenticate. This will work, but may be annoying. Please see logs for more information.'
                );
                break;
            case 'no': // not authorized
                console.error('Not authorized to change NetworkManager connection zone.');
                this.emit(
                    'dependency-error',
                    true,
                    'dependency-error-networkmanager',
                    'Not authorized to change NetworkManager connection zone',
                    'You are not authorized to change the connection zone in NetworkManager. This is required for ' +
                        'Zone Defense to function properly. Please see logs for more information.'
                );
                break;
            default:
                console.error(`Unexpected result from NetworkManager GetSettings: ${modifyPermission}`);
                this.emit(
                    'dependency-error',
                    false,
                    'dependency-error-networkmanager',
                    `Unexpected result from NetworkManager GetSettings: ${modifyPermission}`,
                    'Unable to determine whether you are authorized to change the connection zone in NetworkManager. ' +
                        'Zone Defense may not function properly. Please see logs for more information.'
                );
        }
    }
});

