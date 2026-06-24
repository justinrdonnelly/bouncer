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
    Template: 'resource:///io/github/justinrdonnelly/bouncer/ui/dependencyItem.ui',
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
            (binding, value) => [true, this.#convertStatusToIcon(value)],
            null
        );

        dependencyCheck.bind_property_full(
            property,
            this._status,
            'tooltip-text',
            GObject.BindingFlags.SYNC_CREATE,
            // eslint-disable-next-line no-unused-vars
            (binding, value) => [true, this.#convertStatusToText(value)],
            null
        );

        dependencyCheck.bind_property_full(
            property,
            this,
            'subtitle',
            GObject.BindingFlags.SYNC_CREATE,
            // eslint-disable-next-line no-unused-vars
            (binding, value) => [true, this.#convertStatusToText(value)],
            null
        );

        this._button.connect('clicked', callbackFunction);
    }

    #convertStatusToText(status) {
     switch (status) {
            case 0:
                return _('Unknown');
            case 1:
                return _('Ready');
            case 2:
                return _('Suboptimal');
            case 3:
                return _('Not Ready');
            default:
                console.error(`Invalid DependencyItem status: ${status}`);
                return _('Unknown');
        }
    }

    #convertStatusToIcon(status) {
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
