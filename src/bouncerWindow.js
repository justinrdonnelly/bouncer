/* bouncerWindow.js
 *
 * Copyright 2024 Justin Donnelly
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * SPDX-License-Identifier: MPL-2.0
 */

import Adw from 'gi://Adw';
import GObject from 'gi://GObject';

export const BouncerWindow = GObject.registerClass(
    {
        GTypeName: 'BouncerWindow',
        Template: 'resource:///io/github/justinrdonnelly/bouncer/bouncerWindow.ui',
        InternalChildren: ['contentBox'],
    },
    class BouncerWindow extends Adw.ApplicationWindow {
        content = null;

        constructor(application, content) {
            super({ application});
            console.debug('Building window.');
            console.debug(`application: ${application}`);
            this.content = content;
            this._contentBox.append(content);
        }
    }
);
