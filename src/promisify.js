/* promisify.js
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
import Xdp from 'gi://Xdp';

export default function promisify() {
    // https://gjs.guide/guides/gio/file-operations.html#file-operations
    // We'll comment out the things we don't need
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

    // others
    Gio._promisify(Xdp.Portal.prototype, 'request_background', 'request_background_finish');
}
