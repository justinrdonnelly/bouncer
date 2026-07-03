/* moreInfo.js
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

const firewalldUrl = 'https://firewalld.org/';
const networkManagerUrl = 'https://networkmanager.dev/';
const firewalldConnectionsUrl = 'https://firewalld.org/documentation/zone/connections-interfaces-and-sources.html';
const bouncerUrl = 'https://github.com/justinrdonnelly/bouncer';

export const MoreInfoDialog = GObject.registerClass(
    {
        GTypeName: 'MoreInfoDialog',
        Template: 'resource:///io/github/justinrdonnelly/bouncer/ui/moreInfo.ui',
        InternalChildren: ['moreInfoLabel'],
    },
    class MoreInfoDialog extends Adw.Dialog {
        constructor() {
            super();
            this._moreInfoLabel.label = this._moreInfoLabel.label.format(
                firewalldUrl,
                networkManagerUrl,
                firewalldConnectionsUrl,
                bouncerUrl
            );
        }
    }
);
