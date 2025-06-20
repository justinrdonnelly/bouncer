/* data.js
 *
 * Copyright 2025 Justin Donnelly
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * SPDX-License-Identifier: MPL-2.0
 */

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

export class Data {
    static #dataDirectoryPermissions = 0o700; // gnome-control-center uses 700 (USER_DIR_MODE), so we'll do that too
    static #textFormat = 'utf-8';
    #fileName;
    #destination;
    #destinationFile;
    #destinationDirectory;

    constructor(fileName) {
        this.#fileName = fileName;
        const dataDir = GLib.get_user_data_dir();
        this.#destination = GLib.build_filenamev([dataDir, 'bouncer', this.#fileName]);
        this.#destinationFile = Gio.File.new_for_path(this.#destination);
        this.#destinationDirectory = this.#destinationFile.get_parent().get_path();
    }

    async getData() {
        // Create the data directory first. It's better to know now if there's a problem.
        if (GLib.mkdir_with_parents(this.#destinationDirectory, Data.#dataDirectoryPermissions) !== 0) {
            // mkdir failed
            throw new Error(`Cannot create directory ${this.#destinationDirectory}`);
        }
        // check for existence of the file
        const dir = Gio.File.new_for_path(this.#destinationDirectory);
        const file = dir.get_child(this.#fileName);
        if (!file.query_exists(null)) {
            // file does not yet exist, that's OK
            console.log(`File ${this.#destination} does not exist. Treat as empty and create it later.`);
            return null;
        }
        // eslint-disable-next-line no-unused-vars
        const [contents, etag] = await this.#destinationFile.load_contents_async(null);
        const decoder = new TextDecoder(Data.#textFormat);
        return decoder.decode(contents);
    }

    async saveData(data) {
        // Don't try/catch here. Allow errors to propagate.
        console.log(`Saving data to ${this.#fileName}.`);
        const encoder = new TextEncoder(Data.#textFormat);
        const encodedData = encoder.encode(data);
        // We already tried to create this directory earlier, so this should only matter if a user somehow deleted it.
        if (GLib.mkdir_with_parents(this.#destinationDirectory, Data.#dataDirectoryPermissions) === 0) {
            // Since we `await` the results, we do not need to use `replace_contents_bytes_async`
            let success = await this.#destinationFile.replace_contents_async(
                encodedData,
                null,
                false,
                Gio.FileCreateFlags.REPLACE_DESTINATION,
                null
            );
            if (!success) {
                throw new Error(`Error saving data file ${this.#destination}.`);
            }
        } else {
            throw new Error(`Error creating directory ${this.#destinationDirectory}.`);
        }
    }
}
