/* networksBox.js
 *
 * Copyright 2026 Justin Donnelly
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * SPDX-License-Identifier: MPL-2.0
 */

import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';

import { getNetworkManagerConnectionSettingsByUuid } from '../networkManagerConnectionSettings.js';

export const NetworksBox = GObject.registerClass(
    {
        GTypeName: 'NetworksBox',
        Template: 'resource:///io/github/justinrdonnelly/bouncer/ui/networksBox.ui',
        InternalChildren: ['comboRow', 'currentZone', 'networks'],
    },
    class NetworksBox extends Gtk.Box {
        #connectionIdsSeen;
        #networks = []; // Array of objects containing uuid, id, zone.

        constructor(connectionIdsSeen) {
            super();
            this.#connectionIdsSeen = connectionIdsSeen;
            this._comboRow.connect('notify::selected', this.#handleNetworkSelected.bind(this));
        }

        async init() {
            const connectionUuids = this.#connectionIdsSeen.connectionIdsSeen
            const networkResults = await Promise.allSettled(
                connectionUuids.map(async (uuid) => {
                    const settings = await getNetworkManagerConnectionSettingsByUuid(uuid);
                    const connection = settings.connection;
                    const id = connection?.id;
                    if (!id) {
                        console.warn(`NetworkManager connection ${uuid} does not have an ID.`);
                        return null;
                    }
                    return {
                        uuid,
                        id,
                        zone: connection?.zone ?? null,
                    };
                })
            );

            this.#networks = networkResults.flatMap((result, index) => {
                if (result.status === 'fulfilled' && result.value !== null)
                    return [result.value];
                if (result.status === 'fulfilled')
                    return [];

                console.warn(`Unable to get NetworkManager settings for connection ` +
                    // eslint-disable-next-line security/detect-object-injection
                    `${connectionUuids[index]}: ${result.reason}`);
                return [];
            });

            for (const network of this.#networks)
                this._networks.append(network.id);

            if (this.#networks.length > 0) {
                this._comboRow.set_selected(0);
            } else {
                this._comboRow.sensitive = false;
            }
            this.#handleNetworkSelected();
        }

        // Update the Zone info when the selected connection is changed
        #handleNetworkSelected() {
            const selected = this._comboRow.get_selected();
            // eslint-disable-next-line security/detect-object-injection
            const network = this.#networks[selected];
            if (network === undefined || network === null) {
                this._currentZone.subtitle = '';
                return;
            }

            this._currentZone.subtitle = network.zone ?? _('Default Zone');
        }

    }
);
