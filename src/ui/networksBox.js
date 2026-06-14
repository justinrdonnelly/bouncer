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
        Properties: {
            'connection-ids-seen': GObject.ParamSpec.jsobject(
                'connection-ids-seen',
                'connection IDs seen',
                'NetworkManager connection UUIDs to show in the networks list',
                GObject.ParamFlags.READWRITE,
            ),
        },
    },
    class NetworksBox extends Gtk.Box {
        #connectionUuidsSeen = []; // Local copy of the bound connection UUIDs.
        #networks = []; // Array of objects containing uuid, id, zone.
        #refreshNetworksSequence = 0; // Used to ignore stale refresh results that finish out of order.

        constructor(connectionIdsSeen) {
            super();
            this._comboRow.connect('notify::selected', this.#handleNetworkSelected.bind(this));
            connectionIdsSeen.bind_property(
                'connection-ids-seen',
                this,
                'connection-ids-seen',
                GObject.BindingFlags.SYNC_CREATE,
            );
            // The binding will call `set` below
        }

        // setter for the bound connection-ids-seen property
        set connectionIdsSeen(connectionIdsSeen) {
            // Copy (via spread) connectionIdsSeen so we only get changes via property change signals.
            this.#connectionUuidsSeen = [...(connectionIdsSeen ?? [])];
            this.#refreshNetworks().catch((e) => {
                console.error('Unable to refresh networks list.');
                console.error(e.message);
            });
        }

        // Refresh the networks dropdown.
        async #refreshNetworks() {
            const refreshNetworksSequence = ++this.#refreshNetworksSequence;
            // We're going to remove everything from the dropdown. We need to know what was selected, so we can select
            // it again after we repopulate.
            const selectedNetwork = this.#getSelectedNetwork();
            const selectedUuid = selectedNetwork?.uuid ?? null;
            // Look up connection IDs and zones for all the networks.
            const networkResults = await Promise.allSettled(
                this.#connectionUuidsSeen.map(async (uuid) => {
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

            const networks = networkResults.flatMap((result, index) => {
                if (result.status === 'fulfilled' && result.value !== null)
                    return [result.value];
                if (result.status === 'fulfilled')
                    return [];

                console.warn(`Unable to get NetworkManager settings for connection ` +
                    // eslint-disable-next-line security/detect-object-injection
                    `${this.#connectionUuidsSeen[index]}: ${result.reason}`);
                return [];
            });

            // Don't update with old data from an earlier refresh that finished out of order.
            if (refreshNetworksSequence !== this.#refreshNetworksSequence)
                return;

            this.#networks = networks;
            // Now that we have all the info, use it to repopulate the networks dropdown.
            this.#updateNetworkList(selectedUuid);
        }

        // Update the networks dropdown. Select the network from selectedUuid.
        #updateNetworkList(selectedUuid) {
            // Replace contents of networks dropdown. Keep the previously selected value selected.
            this._networks.splice(
                0,
                this._networks.get_n_items(),
                this.#networks.map((network) => network.id)
            );

            if (this.#networks.length > 0) {
                const selected = this.#networks.findIndex((network) => network.uuid === selectedUuid);
                this._comboRow.sensitive = true;
                // Select the previously selected network. If it is no longer in the list, default to 0.
                this._comboRow.set_selected(selected === -1 ? 0 : selected);
            } else {
                this._comboRow.sensitive = false;
            }
            this.#handleNetworkSelected();
        }

        // Return the network object of the selected network.
        #getSelectedNetwork() {
            const selected = this._comboRow.get_selected();
            // eslint-disable-next-line security/detect-object-injection
            return this.#networks[selected];
        }

        // Update the displayed zone info when the selected connection changes.
        #handleNetworkSelected() {
            const network = this.#getSelectedNetwork();
            if (network === undefined || network === null) {
                this._currentZone.subtitle = '';
                return;
            }

            this._currentZone.subtitle = network.zone ?? _('Default Zone');
        }

    }
);
