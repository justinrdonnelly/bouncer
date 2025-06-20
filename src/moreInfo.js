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

export const MoreInfoDialog = GObject.registerClass(
    {
        GTypeName: 'MoreInfoDialog',
        Template: 'resource:///io/github/justinrdonnelly/bouncer/moreInfo.ui',
    },
    class MoreInfoDialog extends Adw.Dialog {}
);
