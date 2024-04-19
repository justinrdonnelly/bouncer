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
    #connectionIdsSeen;
    #destination;
    #destinationFile;

    constructor() {
        this.#promisify();
        const dataDir = GLib.get_user_data_dir();
        this.#destination = GLib.build_filenamev([dataDir, 'zone-defense', 'connection-ids-seen.json']);
        this.#destinationFile = Gio.File.new_for_path(this.#destination);
    }

    // Always call init immediately after constructor.
    async init() {
        this.#connectionIdsSeen = await this.#createConnectionIdsSeen();
    }

    async #createConnectionIdsSeen() {
        try {
            const [contents, etag] = await this.#destinationFile.load_contents_async(null);
            const decoder = new TextDecoder('utf-8');
            const decoded = decoder.decode(contents);
            return JSON.parse(decoded);
        } catch (e) {
            if (e.message.includes('No such file or directory')) { // file does not yet exist, that's OK
                console.log(`${this.#destination} does not exist. Treat as empty and create it later.`);
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
            // This happens when: 1. no write permission on file
            console.log('error caught');
            console.log(e);
        }
    }

    addConnectionIdToSeen(connectionId) {
        this.#connectionIdsSeen.push(connectionId);
        this.#updateConfig(this.#connectionIdsSeen);
    }

    #promisify() {
        // https://gjs.guide/guides/gio/file-operations.html#file-operations
        // Gio._promisify(Gio.File.prototype, 'copy_async');
        // Gio._promisify(Gio.File.prototype, 'create_async');
        // Gio._promisify(Gio.File.prototype, 'delete_async');
        // Gio._promisify(Gio.File.prototype, 'enumerate_children_async');
        Gio._promisify(Gio.File.prototype, 'load_contents_async');
        // Gio._promisify(Gio.File.prototype, 'make_directory_async');
        // Gio._promisify(Gio.File.prototype, 'move_async');
        // Gio._promisify(Gio.File.prototype, 'open_readwrite_async');
        // Gio._promisify(Gio.File.prototype, 'query_info_async');
        Gio._promisify(Gio.File.prototype, 'replace_contents_async');
        // Gio._promisify(Gio.File.prototype, 'replace_contents_bytes_async',
        //     'replace_contents_finish');
        // Gio._promisify(Gio.File.prototype, 'trash_async');

        /* Gio.FileEnumerator */
        Gio._promisify(Gio.FileEnumerator.prototype, 'next_files_async');

        /* Gio.InputStream */
        // Gio._promisify(Gio.InputStream.prototype, 'read_bytes_async');

        /* Gio.OutputStream */
        // Gio._promisify(Gio.OutputStream.prototype, 'write_bytes_async');
    }
}
