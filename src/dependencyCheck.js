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
import Xdp from 'gi://Xdp';

import { config } from './config.js';
import { Data } from './data.js';
import { ErrorSignal } from './errorSignal.js';
import { ZoneInfo } from './zoneInfo.js';

export const DependencyCheck = GObject.registerClass(
    {
        Signals: {
            'first-run-setup-complete': {},
        },
        Properties: {
            'status-dbus': GObject.ParamSpec.uint(
                'status-dbus',
                'status D-Bus',
                'Status for whether DBus ListNames returned',
                GObject.ParamFlags.READWRITE,
                0,
                3,
                0,
            ),
            'status-firewalld-running': GObject.ParamSpec.uint(
                'status-firewalld-running',
                'status firewalld running',
                'Status for whether firewalld is running',
                GObject.ParamFlags.READWRITE,
                0,
                3,
                0,
            ),
            'status-network-manager-running': GObject.ParamSpec.uint(
                'status-network-manager-running',
                'status NetworkManager running',
                'Status for whether NetworkManager is running',
                GObject.ParamFlags.READWRITE,
                0,
                3,
                0,
            ),
            'status-network-manager-permissions': GObject.ParamSpec.uint(
                'status-network-manager-permissions',
                'status NetworkManager permissions',
                'Status for whether NetworkManager permissions are good',
                GObject.ParamFlags.READWRITE,
                0,
                3,
                0,
            ),
            'status-startup': GObject.ParamSpec.uint(
                'status-startup',
                'status startup',
                'Status for whether startup is configured',
                GObject.ParamFlags.READWRITE,
                0,
                3,
                0,
            ),
        },
    },
    class DependencyCheck extends ErrorSignal {
        static #fileName = 'first-run-complete';

        #dbusNames; // A promise that resolves to a list of D-Bus names. Use `await`.
        #data; // An instance of Data

        constructor(constructProperties = {}) {
            super(constructProperties);
            this.#dbusListNames();
            this.#data = new Data(DependencyCheck.#fileName);
        }

        #dbusListNames() {
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
            try {
                const [firstRunData] = await Promise.all([
                    // All these methods must throw an error if they don't want first-run-setup-complete signal to be
                    // emitted (and the corresponding notification generated).
                    this.#data.getData(), // this will return null on the first run, true otherwise
                    this.runOnStartup(),
                    this.checkListNames(),
                    this.checkFirewalld(),
                    this.checkNetworkManagerRunning(),
                    this.checkNetworkManagerPermissions(),
                ]);
                if (firstRunData === null) {
                    this.emit('first-run-setup-complete');
                    // set a value so we don't do this again
                    try {
                        await this.#data.saveData('true');
                    } catch {
                        // Just swallow this error. There's nothing we can do.
                    }
                }
            } catch {
                console.log('Error in dependency checks. Not performing first run logic.');
            }
        }

        // This is not really a dependency. But we need to run on startup to actually be useful.
        async runOnStartup() {
            try {
                console.log('Configuring autostart');
                const portal = new Xdp.Portal();
                // https://libportal.org/method.Portal.request_background.html
                await portal.request_background(
                    null,
                    _('Bouncer must start on login'),
                    [config.APP_ID],
                    Xdp.BackgroundFlags.AUTOSTART,
                    null, // cancellable
                    // callback is N/A since we've used promisify
                    null // user_data
                );
                this.statusStartup = 1;
                console.log('Successfully configured autostart');
            } catch (e) {
                this.statusStartup = 3;
                console.error('Error configuring autostart.');
                console.error(e.message);
                this.emitError(
                    false,
                    'dependency-error-autostart',
                    _('Can\'t configure autostart'),
                    _('Please make sure the portal is available from inside the flatpak sandbox. Please see logs for ' +
                        'more information.')
                );
                throw e;
            }
        }

        async checkListNames() {
            try {
                const names = await this.#dbusNames;
                if (names.length > 0) {
                    this.statusDbus = 1;
                } else {
                    this.statusDbus = 3;
                }
            } catch (e) {
                this.statusDbus = 3;
                console.error('Error awaiting D-Bus names. This is likely a result of the ListNames method call.');
                console.error(e.message);
                this.emitError(
                    true,
                    'dependency-error-names',
                    _('Can\'t find D-Bus names'),
                    _('Please make sure D-Bus is installed, running, and available inside the flatpak sandbox. ' +
                        'Please see logs for more information.')
                );
                throw e;
            }
        }

        async checkFirewalld() {
            // We have already handled any errors with #dbusNames. So we'll swallow those errors here. We wouldn't be
            // able to continue, so we'll just return.
            try {
                await this.#dbusNames;
            } catch {
                this.statusFirewalldRunning = 0; // we don't know the status
                console.log('Skipping check for firewalld on D-Bus due to previous ListNames error.');
                return;
            }

            // confirm firewalld is running
            if ((await this.#dbusNames).includes('org.fedoraproject.FirewallD1')) {
                this.statusFirewalldRunning = 1;
                console.log('Found firewalld on D-Bus.');
            } else {
                this.statusFirewalldRunning = 3;
                console.error('Didn\'t see firewalld on D-Bus.');
                this.emitError(
                    true,
                    'dependency-error-firewalld',
                    _('Can\'t find firewalld'),
                    _('Please make sure firewalld is installed, running, and available inside the flatpak sandbox. ' +
                        'Please see logs for more information.')
                );
                throw new Error('Firewalld not on D-Bus');
            }

            // Check firewalld permissions. There's no permissions D-Bus API, but since all our method calls don't make
            // any changes, we can just make those same calls now to confirm they work.
            try {
                await ZoneInfo.getZones();
                console.log('Got firewalld zones.');
            } catch (e) {
                console.error('Can\'t get firewalld zones.');
                console.error(e.message);
                this.emitError(
                    true,
                    'dependency-error-firewalld',
                    _('Can\'t get firewalld zones'),
                    _('Unable to get firewalld zones. Please make sure firewalld permissions are correct, and are ' +
                        'not restricted inside the flatpak sandbox. Please see logs for more information.')
                );
                throw e;
            }
            try {
                await ZoneInfo.getDefaultZone();
                console.log('Got firewalld default zone.');
            } catch (e) {
                console.error('Can\'t get firewalld default zone.');
                console.error(e.message);
                this.emitError(
                    true,
                    'dependency-error-firewalld',
                    _('Can\'t get firewalld default zone'),
                    _('Unable to get firewalld default zone. Please make sure firewalld permissions are correct, and ' +
                        'are not restricted inside the flatpak sandbox. Please see logs for more information.')
                );
                throw e;
            }
        }

        async checkNetworkManagerRunning() {
            // We have already handled any errors with #dbusNames. So we'll swallow those errors here. We wouldn't be
            // able to continue, so we'll just return.
            try {
                await this.#dbusNames;
            } catch {
                this.statusNetworkManagerRunning = 0; // we don't know the status
                console.log('Skipping check for NetworkManager on D-Bus due to previous ListNames error.');
                return;
            }

            // confirm NetworkManager is running
            if ((await this.#dbusNames).includes('org.freedesktop.NetworkManager')) {
                this.statusNetworkManagerRunning = 1;
                console.log('Found NetworkManager on D-Bus.');
            } else {
                this.statusNetworkManagerRunning = 3;
                console.error('Didn\'t see NetworkManager on D-Bus.');
                this.emitError(
                    true,
                    'dependency-error-networkmanager',
                    _('Can\'t find NetworkManager'),
                    _('Please make sure NetworkManager is installed, running, and available inside the flatpak ' +
                        'sandbox. Please see logs for more information.')
                );
                throw new Error('NetworkManager not on D-Bus');
            }
        }

        async checkNetworkManagerPermissions() {
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
                    this.statusNetworkManagerPermissions = 1;
                    console.log('Authentication not required to change NetworkManager connection zone.');
                    break;
                case 'auth': // authorized, but requires polkit authentication
                    this.statusNetworkManagerPermissions = 2;
                    console.warn('Authentication required to change NetworkManager connection zone.');
                    this.emitError(
                        false,
                        'dependency-error-networkmanager',
                        _('Authentication required to change NetworkManager connection zone'),
                        _('You are authorized to change the connection zone in NetworkManager, but will be required ' +
                            'to authenticate. This will work, but may be annoying. Please see logs for more ' +
                            'information.')
                    );
                    break; // Don't throw an error. Everything is basically OK.
                case 'no': // not authorized
                    this.statusNetworkManagerPermissions = 3;
                    console.error('Not authorized to change NetworkManager connection zone.');
                    this.emitError(
                        true,
                        'dependency-error-networkmanager',
                        _('Not authorized to change NetworkManager connection zone'),
                        _('You are not authorized to change the connection zone in NetworkManager. This is required ' +
                            'for Bouncer to function properly. Please see logs for more information.')
                    );
                    throw new Error('Not authorized to change NetworkManager');
                default:
                    this.statusNetworkManagerPermissions = 3;
                    console.error(`Unexpected result from NetworkManager GetSettings: ${modifyPermission}`);
                    this.emitError(
                        false,
                        'dependency-error-networkmanager',
                        _('Unexpected result from NetworkManager GetSettings: ') + modifyPermission,
                        _('Unable to determine whether you are authorized to change the connection zone in ' +
                            'NetworkManager. Bouncer may not function properly. Please see logs for more information.')
                    );
                    throw new Error('Unexpected result from NetworkManager GetSettings');
            }
        }
    }
);
