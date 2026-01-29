/* dependencyItem.js
 *
 * Copyright 2025 Justin Donnelly
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * SPDX-License-Identifier: MPL-2.0
 */

import Adw from 'gi://Adw';
import GObject from 'gi://GObject';

export const DependencyItem = GObject.registerClass({
    GTypeName: 'DependencyItem',
    Template: 'resource:///io/github/justinrdonnelly/bouncer/dependencyItem.ui',
    InternalChildren: ['button', 'status'],
}, class DependencyItem extends Adw.ActionRow {
    constructor(title, dependencyCheck, property, callbackFunction) {
        super();
        this.title = title;

        dependencyCheck.bind_property_full(
            property,
            this._status,
            'label',
            GObject.BindingFlags.SYNC_CREATE,
            // eslint-disable-next-line no-unused-vars
            (binding, value) => [true, this.#convertStatus(value)],
            null,
        );
        this._button.connect('clicked', callbackFunction);
    }

    #convertStatus(status) {
        switch (status) {
            case 0:
            return '⚪';
            case 1:
            return '🟢';
            case 2:
            return '🟡';
            case 3:
            return '🔴';
            default:
            console.error(`Invalid DependencyItem status: ${status}`);
            return '⚪';
        }
    }
});
