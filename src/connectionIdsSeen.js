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

import { Data } from './data.js';

export class ConnectionIdsSeen {
    static #fileName = 'connection-ids-seen.json';
    #connectionIdsSeen; // array of connection IDs for this machine
    #allConnectionIdsSeen; // map of machine ID to array of connection IDs for the machine
    #data;

    constructor() {
        this.#data = new Data(ConnectionIdsSeen.#fileName);
    }

    // Always call init immediately after constructor.
    async init() {
        // Don't try/catch here. Allow errors to propagate.
        const [data, machineId] = await Promise.all([this.#data.getData(), this.getMachineId()]);

        if (data === null) {
            this.#connectionIdsSeen = [];
            this.#allConnectionIdsSeen = {[machineId]: this.#connectionIdsSeen};
        } else {
            this.#allConnectionIdsSeen = JSON.parse(data);
            // We'll have to migrate existing setups from purely array based to an object, where the key is the machine
            // ID, and the value is the array of connection IDs.
            // This code is temporary, and should be removed after we figure users have migrated to the new format.
            if (Array.isArray(this.#allConnectionIdsSeen)) { // It's an array (old format). Convert it.
                console.log(`Migrating data format for ${ConnectionIdsSeen.#fileName}`);
                this.#connectionIdsSeen = this.#allConnectionIdsSeen;
                this.#allConnectionIdsSeen = {[machineId]: this.#connectionIdsSeen};
                // save it to update the format of the saved data
                await this.save();
            } else {
                const newMachine = !Object.hasOwn(this.#allConnectionIdsSeen, machineId);
                if (newMachine) {
                    this.#allConnectionIdsSeen[machineId] = [];
                }
                this.#connectionIdsSeen = this.#allConnectionIdsSeen[machineId];
            }
        }
    }

    isConnectionNew(connectionId) {
        console.log(`Checking to see if connection ${connectionId} is new.`);
        const isNew = !this.#connectionIdsSeen.includes(connectionId);
        console.log(`Connection ${connectionId} is ${isNew ? '' : 'not '}new.`);
        return isNew;
    }

    addConnectionIdToSeen(connectionId) {
        console.log(`Adding ${connectionId} to ${ConnectionIdsSeen.#fileName}.`);
        this.#connectionIdsSeen.push(connectionId);
    }

    async save() {
        // Don't try/catch here. Allow errors to propagate.
        const dataJSON = JSON.stringify(this.#allConnectionIdsSeen);
        this.#data.saveData(dataJSON);
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

}
