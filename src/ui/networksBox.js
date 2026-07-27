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

import Adw from 'gi://Adw?version=1';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=4.0';

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
        Signals: {
            'toast-requested': {
                param_types: [Adw.Toast.$gtype],
            },
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
        #networkActionQueue = Promise.resolve(); // Tail of the network action queue.
        #networkActionsPending = 0; // Number of queued or running network actions.
        #zoneChangeToast = null; // The toast offering to undo the most recent zone change.

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
                // Select the previously selected network. If it is no longer in the list, default to 0.
                this._comboRow.set_selected(selected === -1 ? 0 : selected);
            }
            this.#handleNetworkSelected();
        }

        // Return the network object of the selected network.
        #getSelectedNetwork() {
            const selected = this._comboRow.get_selected();
            // eslint-disable-next-line security/detect-object-injection
            return this.#networks[selected];
        }

        // Update control sensitivity based on the currently available network and zone information.
        #updateControlSensitivity() {
            const network = this.#getSelectedNetwork();
            const hasNetworks = this.#networks.length > 0;
            const networkActionPending = this.#networkActionsPending > 0;
            const networkControlsAvailable = hasNetworks && !networkActionPending;
            const zoneControlsAvailable =
                network !== undefined &&
                network !== null &&
                this.#zoneInfoLoaded &&
                !networkActionPending;
            const selectedZone = getSelectedZone(this._zoneDropDown);

            this._comboRow.sensitive = networkControlsAvailable;
            this._forgetButton.sensitive = networkControlsAvailable;
            this._zoneDropDown.sensitive = zoneControlsAvailable;
            this._changeZoneButton.sensitive =
                zoneControlsAvailable &&
                selectedZone !== undefined &&
                selectedZone !== network.zone;
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
                this.#updateControlSensitivity();
                return;
            }

            // Populate `this._zoneList` and set `selected` to the index of the zone that should be selected.
            const selected = populateZoneList(this._zoneList, this.#allZones, this.#defaultZone, network.zone);
            this._zoneDropDown.set_selected(selected);
            this.#handleZoneSelectionChanged();
        }

        // Enable/disable the 'Change' button based on whether the selected zone in the dropdown is different than the
        // zone that is already associated with the network.
        #handleZoneSelectionChanged() {
            this.#updateControlSensitivity();
        }

        // Queue a network action and keep controls disabled until all pending actions finish.
        #queueNetworkAction(action) {
            this.#networkActionsPending++;
            this.#updateControlSensitivity();

            const queuedAction = this.#networkActionQueue.then(async () => {
                try {
                    await action();
                } finally {
                    this.#networkActionsPending--;
                    this.#updateControlSensitivity();
                }
            });
            // A failed action should not prevent the next queued action from running.
            this.#networkActionQueue = queuedAction.catch(() => {});
            return queuedAction;
        }

        // eslint-disable-next-line no-unused-vars
        async changeZoneButtonClicked(_button) {
            const network = this.#getSelectedNetwork();
            const selectedZone = getSelectedZone(this._zoneDropDown);
            if (network === undefined || selectedZone === undefined)
                return;
            const previousZone = network.zone;

            await this.#queueNetworkAction(async () => {
                try {
                    await ZoneForConnection.setZone(network.objectPath, selectedZone);
                } catch (e) {
                    console.error(`Unable to set zone for NetworkManager connection ${network.uuid}.`);
                    console.error(e.message);
                    this.#handleNetworkSelected();
                    this.#requestErrorToast(_('Zone could not be changed'));
                    return;
                }

                this.#updateNetworkZone(network.uuid, selectedZone);
                this.#showZoneChangeToast(network.uuid, previousZone, selectedZone);
            });
        }

        #updateNetworkZone(connectionUuid, zone) {
            const network = this.#networks.find((currentNetwork) => currentNetwork.uuid === connectionUuid);
            if (network !== undefined)
                network.zone = zone;
            this.#handleNetworkSelected();
        }

        #showZoneChangeToast(connectionUuid, previousZone, selectedZone) {
            this.#zoneChangeToast?.dismiss();

            const toast = new Adw.Toast({
                // Translators: %s is the name of a firewall zone.
                title: _('Zone changed to %s').format(getZoneDisplayName(selectedZone)),
                button_label: _('_Undo'),
                use_markup: false,
            });
            toast.connect('button-clicked', () => {
                this.#queueNetworkAction(() => this.#undoZoneChange(connectionUuid, previousZone, selectedZone));
            });
            toast.connect('dismissed', () => {
                if (this.#zoneChangeToast === toast)
                    this.#zoneChangeToast = null;
            });
            this.#zoneChangeToast = toast;
            this.emit('toast-requested', toast);
        }

        async #undoZoneChange(connectionUuid, previousZone, selectedZone) {
            try {
                const { objectPath, settings } = await getNetworkManagerConnectionByUuid(connectionUuid);
                // Confirm the zone hasn't been changed outside of Bouncer
                const currentZone = settings.connection?.zone ?? null;
                if (currentZone !== selectedZone) {
                    console.warn(`Not undoing zone change for NetworkManager connection ${connectionUuid}. ` +
                        `The zone has changed from ${selectedZone} to ${currentZone}.`);
                    this.#updateNetworkZone(connectionUuid, currentZone);
                    this.#requestErrorToast(_('Unable to undo because the zone changed again'));
                    return;
                }

                await ZoneForConnection.setZone(objectPath, previousZone);
                this.#updateNetworkZone(connectionUuid, previousZone);
            } catch (e) {
                console.error(`Unable to undo zone change for NetworkManager connection ${connectionUuid}.`);
                console.error(e.message);
                this.#requestErrorToast(_('Zone change could not be undone'));
            }
        }

        // eslint-disable-next-line no-unused-vars
        async forgetButtonClicked(_button) {
            const selected = this._comboRow.get_selected();
            // eslint-disable-next-line security/detect-object-injection
            const network = this.#networks[selected];
            if (network === undefined)
                return;

            await this.#queueNetworkAction(async () => {
                try {
                    await this.#connectionIdsSeen.forgetConnection(network.uuid);
                } catch (e) {
                    console.error(`Unable to forget NetworkManager connection ${network.uuid}.`);
                    console.error(e.message);
                    this.#requestErrorToast(_('Network could not be forgotten'));
                    return;
                }

                const toast = new Adw.Toast({
                    // Translators: %s is the NetworkManager connection name.
                    title: _('Network forgotten: %s').format(network.id),
                    button_label: _('_Undo'),
                    use_markup: false,
                });
                toast.connect('button-clicked', () => {
                    this.#queueNetworkAction(() => this.#restoreConnection(network));
                });
                this.emit('toast-requested', toast);
            });
        }

        async #restoreConnection(network) {
            try {
                await this.#connectionIdsSeen.restoreConnection(network.uuid);
            } catch (e) {
                console.error(`Unable to restore NetworkManager connection ${network.uuid}.`);
                console.error(e.message);
                this.#requestErrorToast(_('Network could not be restored'));
            }
        }

        #requestErrorToast(title) {
            this.emit('toast-requested', new Adw.Toast({
                title,
                priority: Adw.ToastPriority.HIGH,
                use_markup: false,
            }));
        }
    }
);
