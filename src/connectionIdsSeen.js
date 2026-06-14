/* connectionIdsSeen.js
 *
 * Copyright 2024 Justin Donnelly
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * SPDX-License-Identifier: MPL-2.0
 */

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';

import { Data } from './data.js';
import { migrateDataIfNecessary } from './dataMigration.js';

export const ConnectionIdsSeen = GObject.registerClass(
    {
        GTypeName: 'ConnectionIdsSeen',
        Properties: {
            'connection-ids-seen': GObject.ParamSpec.jsobject(
                'connection-ids-seen',
                'connection IDs seen',
                'NetworkManager connection UUIDs already seen by Bouncer',
                GObject.ParamFlags.READWRITE,
            ),
        },
    },
    class ConnectionIdsSeen extends GObject.Object {
    static #fileName = 'connection-ids-seen.json';
    #allConnectionIdsSeen; // map of machine ID to array of connection UUIDs for the machine
    #data;
    #initialized = false; // whether `init` has been called

    constructor(constructProperties = {}) {
        super(constructProperties);
        this.#data = new Data(ConnectionIdsSeen.#fileName);
    }

    // Always call init immediately after constructor.
    async init() {
        if (this.#initialized) {
            return;
        }
        console.log('Initializing ConnectionIdsSeen');
        // Don't try/catch here. Allow errors to propagate.
        const [data, machineId] = await Promise.all([this.#data.getData(), this.getMachineId()]);

        if (data === null) {
            this.connectionIdsSeen = [];
            this.#allConnectionIdsSeen = new Map([['version', 3], [machineId, this.connectionIdsSeen]]);
        } else {
            const parsedData = JSON.parse(data);
            const migratedData = await migrateDataIfNecessary(parsedData, machineId);
            this.#allConnectionIdsSeen = new Map(Object.entries(migratedData));

            if (migratedData !== parsedData) {
                await this.save();
            }

            const newMachine = !this.#allConnectionIdsSeen.has(machineId);
            if (newMachine) {
                this.#allConnectionIdsSeen.set(machineId, []);
            }
            this.connectionIdsSeen = this.#allConnectionIdsSeen.get(machineId);
        }
        this.#initialized = true;
    }

    isConnectionNew(connectionUuid) {
        console.log(`Checking to see if connection ${connectionUuid} is new.`);
        const isNew = !this.connectionIdsSeen.includes(connectionUuid);
        console.log(`Connection ${connectionUuid} is ${isNew ? '' : 'not '}new.`);
        return isNew;
    }

    addConnectionIdToSeen(connectionUuid) {
        if (this.connectionIdsSeen.includes(connectionUuid))
            return;

        console.log(`Adding ${connectionUuid} to ${ConnectionIdsSeen.#fileName}.`);
        this.connectionIdsSeen.push(connectionUuid);
        // Since we're changing this.connectionIdsSeen (not using a property setter), we need to call notify.
        this.notify('connection-ids-seen');
    }

    async save() {
        // Don't try/catch here. Allow errors to propagate.
        const dataJSON = JSON.stringify(Object.fromEntries(this.#allConnectionIdsSeen));
        await this.#data.saveData(dataJSON);
    }

    async getMachineId() {
        return new Promise((resolve, reject) => {
            Gio.DBus.session.call(
                'io.github.justinrdonnelly.bouncer',
                '/io/github/justinrdonnelly/bouncer',
                'org.freedesktop.DBus.Peer',
                'GetMachineId',
                null,
                new GLib.VariantType('(s)'), // reply type
                Gio.DBusCallFlags.NONE,
                -1, // timeout
                null, // cancellable
                (connection, res) => {
                    try {
                        const reply = connection.call_finish(res);
                        resolve(reply.get_child_value(0).recursiveUnpack());
                    } catch (e) {
                        if (e instanceof Gio.DBusError)
                            Gio.DBusError.strip_remote_error(e);
                        reject(e);
                    }
                }
            );
        });
    }

});
