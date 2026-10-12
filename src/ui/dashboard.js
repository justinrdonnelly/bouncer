/* dashboard.js
 *
 * Copyright 2026 Justin Donnelly
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * SPDX-License-Identifier: MPL-2.0
 */

import Adw from 'gi://Adw?version=1';
import GObject from 'gi://GObject';

export const Dashboard = GObject.registerClass(
    {
        GTypeName: 'Dashboard',
        Template: 'resource:///io/github/justinrdonnelly/bouncer/ui/dashboard.ui',
        InternalChildren: ['content', 'dependencyBox', 'networksBox', 'splitView', 'stack', 'toastOverlay'],
    },
    // eslint-disable-next-line no-shadow
    class Dashboard extends Adw.ApplicationWindow {
        dependencyBox = null;
        #networksBox = null;
        #toastRequestedHandlerId = 0;

        constructor(application, dependencyBox, networksBox) {
            super({ application });
            console.debug('Building dashboard window.');
            this.dependencyBox = dependencyBox;
            this._dependencyBox.append(dependencyBox);
            if (networksBox) {
                this.#networksBox = networksBox;
                this.#toastRequestedHandlerId = networksBox.connect('toast-requested', this.#showToast.bind(this));
                this._networksBox.append(networksBox);
            } else
                this._networksBox.append(this.#createNetworksUnavailablePage());
            this.#setContentTitle();
        }

        // The application calls this on window removal, before widgets are finalized.
        cleanup() {
            this.dependencyBox?.cleanup();
            this.dependencyBox = null;
            if (this.#networksBox !== null) {
                this.#networksBox.disconnect(this.#toastRequestedHandlerId);
                this.#toastRequestedHandlerId = 0;
                this._toastOverlay.dismiss_all();
                this.#networksBox.cleanup();
                this.#networksBox = null;
            }
        }

        // eslint-disable-next-line no-unused-vars
        #showToast(_networksBox, toast) {
            this._toastOverlay.add_toast(toast);
        }

        #createNetworksUnavailablePage() {
            return new Adw.StatusPage({
                description: _('Bouncer could not load your saved networks. Please see the logs for more information.'),
                icon_name: 'network-error-symbolic',
                title: _('Saved Networks Unavailable'),
                vexpand: true,
            });
        }

        // set content title to match the selected page
        #setContentTitle() {
            this._content.title = this._stack.get_pages().get_selected_page().get_title();
        }

        sidebarActivatedCallback() {
            this._splitView.set_show_content(true);
            this.#setContentTitle();
        }
    }
);
