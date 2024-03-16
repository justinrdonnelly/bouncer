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

import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

export class ConnectionIdsSeen {
    #connectionIdsSeen; // this is a promise that resolves to an array
    #destinationFile;

    constructor() {
        this.#promisify();
        const dataDir = GLib.get_user_config_dir();
        const destination = GLib.build_filenamev([dataDir, 'zone-defense', 'connection-ids-seen.json']);
        this.#destinationFile = Gio.File.new_for_path(destination);
        this.#connectionIdsSeen = this.#createConnectionIdsSeenPromise();
    }

    async #createConnectionIdsSeenPromise() {
        try {
            const [contents, etag] = await this.#destinationFile.load_contents_async(null);
            // console.log('here');
            // console.log('etag');
            // console.log(etag);
            // console.log('contents');
            // console.log(contents);
            const decoder = new TextDecoder('utf-8');
            const decoded = decoder.decode(contents);
            console.log(`contents: ${decoded}`);
            return JSON.parse(decoded);
        } catch (e) {
            console.warn(`Error reading file: ${this.#destinationFile.get_path()} (possibly file does not yet exist). Defaulting to empty list`);
            return new Promise((resolve) => { resolve([]) });
        }
    }

    async isConnectionNew(connectionId) {
        const connectionIds = await this.#connectionIdsSeen;
        console.log(`connectionIds: ${connectionIds}`);
        console.log(`checking for connectionId ${connectionId} in connectionIds`);
        return !connectionIds.includes(connectionId);
    }

    async #updateConfig(connectionIds) {
        try {
            const dataJSON = JSON.stringify(connectionIds);
            const encoder = new TextEncoder('utf-8');
            const encodedData = encoder.encode(dataJSON);
            if (GLib.mkdir_with_parents(this.#destinationFile.get_parent().get_path(), 0o700) === 0) { // gnome-control-center uses 700 (USER_DIR_MODE), so we'll do that too
                // Since we `await` the results, we do not need to use `replace_contents_bytes_async`
                let success = await this.#destinationFile.replace_contents_async(encodedData, null, false, Gio.FileCreateFlags.REPLACE_DESTINATION, null);

                if (success) {
                    /* it worked! */
                    console.log('success saving data file');
                    console.log(success);
                } else {
                    console.log('error saving data file');
                    /* it failed */
                }
            } else {
                console.log('error creating data directory');
                /* error */
            }
        } catch (e) {
            console.log('error caught');
            console.log(e);
        }
    }

    async addConnectionIdToSeen(connectionId) {
        const connectionIds = await this.#connectionIdsSeen;
        console.log(`adding ${connectionId} to seen`);
        connectionIds.push(connectionId); // this also adds to #connectionIdsSeen
        console.log(`connectionIds after adding: ${connectionIds}`);
        this.#updateConfig(connectionIds);
    }

    #promisify() {
        // https://gjs.guide/guides/gio/file-operations.html#file-operations
        Gio._promisify(Gio.File.prototype, 'copy_async');
        Gio._promisify(Gio.File.prototype, 'create_async');
        Gio._promisify(Gio.File.prototype, 'delete_async');
        Gio._promisify(Gio.File.prototype, 'enumerate_children_async');
        Gio._promisify(Gio.File.prototype, 'load_contents_async');
        Gio._promisify(Gio.File.prototype, 'make_directory_async');
        Gio._promisify(Gio.File.prototype, 'move_async');
        Gio._promisify(Gio.File.prototype, 'open_readwrite_async');
        Gio._promisify(Gio.File.prototype, 'query_info_async');
        Gio._promisify(Gio.File.prototype, 'replace_contents_async');
        Gio._promisify(Gio.File.prototype, 'replace_contents_bytes_async',
            'replace_contents_finish');
        Gio._promisify(Gio.File.prototype, 'trash_async');

        /* Gio.FileEnumerator */
        Gio._promisify(Gio.FileEnumerator.prototype, 'next_files_async');

        /* Gio.InputStream */
        Gio._promisify(Gio.InputStream.prototype, 'read_bytes_async');

        /* Gio.OutputStream */
        Gio._promisify(Gio.OutputStream.prototype, 'write_bytes_async');
    }
}
