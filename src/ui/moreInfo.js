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
    // eslint-disable-next-line no-shadow
    class MoreInfoDialog extends Adw.Dialog {
        constructor() {
            super();
            // Translators: Do not translate or modify %1$s, %2$s, %3$s, or %4$s. They are replaced with the
            // firewalld, NetworkManager, firewalld connection documentation, and Bouncer URLs, respectively.
            this._moreInfoLabel.label = _('You\'re using <a href="%1$s">firewalld</a> as your firewall. ' +
                'One of the nice features about ' +
                'firewalld is that it supports different zones (sets of firewall rules). You may have a firewall ' +
                'zone configured for home use, and a different zone for public networks.\n\n' +
                'You\'re using <a href="%2$s">NetworkManager</a> for network configuration. NetworkManager ' +
                'integrates well with firewalld and can <a href="%3$s">set the firewalld zone for an interface based ' +
                'on the connection</a>. This means your firewall rules can automatically change depending on your ' +
                'network connection.\n\n' +
                'Bouncer is designed to make this easier for you. It opens a window when you connect to a new ' +
                'network, allowing you to choose the appropriate firewall zone. If you\'re not sure what to choose, ' +
                'you should probably choose the option that matches where you are. The safest option is usually ' +
                '\'public\'. If you don\'t want to change anything, click \'Skip\'.\n\n' +
                'You can read more about Bouncer <a href="%4$s">here</a>.'
            ).format(
                firewalldUrl,
                networkManagerUrl,
                firewalldConnectionsUrl,
                bouncerUrl
            );
        }
    }
);
