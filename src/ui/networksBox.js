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

import { getNetworkManagerConnectionByUuid } from '../networkManagerConnectionSettings.js';
import * as ZoneForConnection from '../zoneForConnection.js';
import * as ZoneInfo from '../zoneInfo.js';
import { getSelectedZone, getZoneDisplayName, populateZoneList } from '../zoneSelection.js';

export const NetworksBox = GObject.registerClass(
    {
        GTypeName: 'NetworksBox',
        Template: 'resource:///io/github/justinrdonnelly/bouncer/ui/networksBox.ui',
        InternalChildren: [
            'changeZoneButton', 'comboRow', 'currentZone', 'forgetButton', 'networks', 'zoneDropDown', 'zoneList',
        ],
        Properties: {
            'connection-ids-seen': GObject.ParamSpec.jsobject(
                'connection-ids-seen',
                'connection IDs seen',
                'NetworkManager connection UUIDs to show in the networks list',
                GObject.ParamFlags.READWRITE,
            ),
        },
    },
    // eslint-disable-next-line no-shadow
    class NetworksBox extends Gtk.Box {
        #connectionIdsSeen; // ConnectionIdsSeen instance.
        #connectionUuidsSeen = []; // Local copy of the bound connection UUIDs.
        #networks = []; // Array of objects containing uuid, id, objectPath, zone.
        #allZones = []; // Array of zones from firewalld.
        #defaultZone = null; // This will later be the default zone (eg public).
        #zoneInfoLoaded = false; // This will become true once #allZones and #defaultZone are populated.
        #refreshNetworksSequence = 0; // Used to ignore stale refresh results that finish out of order.

        constructor(connectionIdsSeen) {
            super();
            this.#connectionIdsSeen = connectionIdsSeen;
            this._comboRow.connect('notify::selected', this.#handleNetworkSelected.bind(this));
            this._zoneDropDown.connect('notify::selected', this.#handleZoneSelectionChanged.bind(this));
            connectionIdsSeen.bind_property(
                'connection-ids-seen',
                this,
                'connection-ids-seen',
                GObject.BindingFlags.SYNC_CREATE,
            );
            // The binding will call `set` below
            this.#refreshZoneInfo().catch((e) => {
                console.error('Unable to get firewall zone information.');
                console.error(e.message);
                this.#handleZoneInfoUnavailable();
            });
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
                    const { objectPath, settings } = await getNetworkManagerConnectionByUuid(uuid);
                    const connection = settings.connection;
                    const id = connection?.id;
                    if (!id) {
                        console.warn(`NetworkManager connection ${uuid} does not have an ID.`);
                        return null;
                    }
                    return {
                        uuid,
                        id,
                        objectPath,
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

            // Sort the displayed networks without changing the stored UUID order.
            networks.sort((first, second) => first.id.localeCompare(second.id));
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
                this._forgetButton.sensitive = true;
                // Select the previously selected network. If it is no longer in the list, default to 0.
                this._comboRow.set_selected(selected === -1 ? 0 : selected);
            } else {
                this._comboRow.sensitive = false;
                this._forgetButton.sensitive = false;
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
                this.#updateZoneDropDown(null);
                return;
            }

            this._currentZone.subtitle = getZoneDisplayName(network.zone);
            this.#updateZoneDropDown(network);
        }

        // Populate zone info variables and use them to update the zone dropdown.
        async #refreshZoneInfo() {
            [this.#allZones, this.#defaultZone] = await Promise.all([ZoneInfo.getZones(), ZoneInfo.getDefaultZone()]);
            this.#zoneInfoLoaded = true;
            this.#updateZoneDropDown(this.#getSelectedNetwork());
        }

        // Explain why the zone-changing controls are disabled.
        #handleZoneInfoUnavailable() {
            this._zoneDropDown.subtitle = _('Firewall zone information could not be loaded.');
            // this._zoneDropDown and this._changeZoneButton are already not sensitive.
        }

        // Update the zone dropdown based on the currently selected network.
        #updateZoneDropDown(network) {
            this._zoneList.splice(0, this._zoneList.get_n_items(), []);

            if (network === undefined || network === null || !this.#zoneInfoLoaded) {
                this._zoneDropDown.sensitive = false;
                this._changeZoneButton.sensitive = false;
                return;
            }

            // Populate `this._zoneList` and set `selected` to the index of the zone that should be selected.
            const selected = populateZoneList(this._zoneList, this.#allZones, this.#defaultZone, network.zone);
            this._zoneDropDown.sensitive = true;
            this._zoneDropDown.set_selected(selected);
            this.#handleZoneSelectionChanged();
        }

        // Enable/disable the 'Change' button based on whether the selected zone in the dropdown is different than the
        // zone that is already associated with the network.
        #handleZoneSelectionChanged() {
            const network = this.#getSelectedNetwork();
            const selectedZone = getSelectedZone(this._zoneDropDown);
            this._changeZoneButton.sensitive =
                this.#zoneInfoLoaded &&
                network !== undefined &&
                selectedZone !== undefined &&
                selectedZone !== network.zone;
        }

        // eslint-disable-next-line no-unused-vars
        async changeZoneButtonClicked(_button) {
            const network = this.#getSelectedNetwork();
            const selectedZone = getSelectedZone(this._zoneDropDown);
            if (network === undefined || selectedZone === undefined)
                return;

            this._zoneDropDown.sensitive = false;
            this._changeZoneButton.sensitive = false;
            try {
                await ZoneForConnection.setZone(network.objectPath, selectedZone);
            } catch (e) {
                console.error(`Unable to set zone for NetworkManager connection ${network.uuid}.`);
                console.error(e.message);
                this.#handleNetworkSelected();
                return;
            }

            const updatedNetwork = this.#networks.find((currentNetwork) => currentNetwork.uuid === network.uuid);
            if (updatedNetwork !== undefined)
                updatedNetwork.zone = selectedZone;
            this.#handleNetworkSelected();
        }

        // eslint-disable-next-line no-unused-vars
        async forgetButtonClicked(_button) {
            const selected = this._comboRow.get_selected();
            // eslint-disable-next-line security/detect-object-injection
            const network = this.#networks[selected];
            if (network === undefined)
                return;

            try {
                await this.#connectionIdsSeen.forgetConnection(network.uuid);
            } catch (e) {
                console.error(`Unable to forget NetworkManager connection ${network.uuid}.`);
                console.error(e.message);
                return;
            }
        }
    }
);
