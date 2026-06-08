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

import Adw from 'gi://Adw';
import GObject from 'gi://GObject';

export const Dashboard = GObject.registerClass(
    {
        GTypeName: 'Dashboard',
        Template: 'resource:///io/github/justinrdonnelly/bouncer/ui/dashboard.ui',
        InternalChildren: ['content', 'dependencyBox', 'networksBox', 'splitView', 'stack'],
    },
    class Dashboard extends Adw.ApplicationWindow {
        dependencyBox = null;

        constructor(application, dependencyBox, networksBox) {
            super({ application });
            console.debug('Building dashboard window.');
            this.dependencyBox = dependencyBox;
            this._dependencyBox.append(dependencyBox);
            this._networksBox.append(networksBox);
            this.#setContentTitle();
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
