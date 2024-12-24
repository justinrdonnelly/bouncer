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

export class ConnectionIdsSeen {
    static #dataDirectoryPermissions = 0o700; // gnome-control-center uses 700 (USER_DIR_MODE), so we'll do that too
    static #textFormat = 'utf-8';
    #connectionIdsSeen;
    #fileName = 'connection-ids-seen.json';
    #destination;
    #destinationFile;
    #destinationDirectory;

    constructor() {
        const dataDir = GLib.get_user_data_dir();
        this.#destination = GLib.build_filenamev([dataDir, 'zone-defense', this.#fileName]);
        this.#destinationFile = Gio.File.new_for_path(this.#destination);
        this.#destinationDirectory = this.#destinationFile.get_parent().get_path();
    }

    // Always call init immediately after constructor.
    async init() {
        if (GLib.mkdir_with_parents(this.#destinationDirectory, ConnectionIdsSeen.#dataDirectoryPermissions) !== 0)
            // mkdir failed
            throw new Error(`Cannot create directory ${this.#destinationDirectory}`);
        this.#connectionIdsSeen = await this.#createConnectionIdsSeen();
    }

    async #createConnectionIdsSeen() {
        try {
            // eslint-disable-next-line no-unused-vars
            const [contents, etag] = await this.#destinationFile.load_contents_async(null);
            const decoder = new TextDecoder(ConnectionIdsSeen.#textFormat);
            const decoded = decoder.decode(contents);
            return JSON.parse(decoded);
        } catch (e) {
            if (e.message.includes('No such file or directory')) {
                // file does not yet exist, that's OK
                console.log(`File ${this.#destination} does not exist. Treat as empty and create it later.`);
                return [];
            }
            else
                throw e;
        }
    }

    isConnectionNew(connectionId) {
        console.log(`Checking to see if connection ${connectionId} is new.`);
        const isNew = !this.#connectionIdsSeen.includes(connectionId);
        console.log(`Connection ${connectionId} is ${isNew ? '' : 'not '}new.`);
        return isNew;
    }

    async #updateConfig(connectionIds) {
        try {
            const dataJSON = JSON.stringify(connectionIds);
            const encoder = new TextEncoder(ConnectionIdsSeen.#textFormat);
            const encodedData = encoder.encode(dataJSON);
            // We already tried to create this directory earlier, so this should only matter if a user somehow deleted
            // it.
            if (GLib.mkdir_with_parents(
                this.#destinationDirectory, ConnectionIdsSeen.#dataDirectoryPermissions) === 0) {
                // Since we `await` the results, we do not need to use `replace_contents_bytes_async`
                let success = await this.#destinationFile.replace_contents_async(
                    encodedData,
                    null,
                    false,
                    Gio.FileCreateFlags.REPLACE_DESTINATION,
                    null
                );
                if (!success) {
                    throw new Error(`Error saving data file ${this.#destinationFile}.`);
                }
            } else {
                throw new Error(`Error creating directory ${this.#destinationDirectory}.`);
            }
        } catch (e) {
            // Besides the `throw`s above, this happens when there is no write permission on file. At this point the
            // user has already selected a zone for the connection. Just log this error.
            console.error(`Error updating ${this.#destinationFile}.`);
            console.error(e.message);
            console.log('Once you restart Zone Defense, you will again be prompted to choose a firewall zone for ' +
                `connection ${connectionIds.slice(-1)}.`);
        }
    }

    addConnectionIdToSeen(connectionId) {
        console.log(`Adding ${connectionId} to ${this.#fileName}.`);
        this.#connectionIdsSeen.push(connectionId);
        this.#updateConfig(this.#connectionIdsSeen);
    }

}
