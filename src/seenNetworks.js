/* seenNetworks.js
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

export class SeenNetworks {
    #seenNetworks;

    constructor() {
        const dataDir = GLib.get_user_config_dir();
        const destination = GLib.build_filenamev([dataDir, 'zone-defense', 'seenNetworks.json']);
        const destinationFile = Gio.File.new_for_path(destination);

        const [success, contents] = destinationFile.load_contents(null);
        console.log('success');
        console.log(success);
        console.log('contents');
        console.log(contents);
        const decoder = new TextDecoder('utf-8');
        const contentsString = decoder.decode(contents);
        console.log(contentsString);

        // const sourceFile = destinationFile.read(null);
        // const contents = sourceFile.read(null, 10);
        // console.log(contents);

        const lastUsedFile = {
            fileName: "/file/path/is/here",
            fileDescription: "this is a description of the file"
        };

        const dataJSON = JSON.stringify(lastUsedFile);

        if (GLib.mkdir_with_parents(destinationFile.get_parent().get_path(), 0o700) === 0) { // gnome-control-center uses 700 (USER_DIR_MODE), so we'll do that too
            let [success, tag] = destinationFile.replace_contents(dataJSON, null, false, Gio.FileCreateFlags.REPLACE_DESTINATION, null);

            if (success) {
                /* it worked! */
                console.log('success');
                console.log(tag);
            } else {
                console.log('error saving data file');
                /* it failed */
            }
        } else {
            console.log('error creating data directory');
            /* error */
        }
        // this.#seenNetworks = []; // TODO: get actual values here
    }

    get seenNetworks() {
        return [];
    }

    set seenNetworks(seenNetworks) { // TODO: Do I really want this method to exist?
        return;
    }

    set addNetworkToSeen(network) {
        return;
    }

}
