/* dependencyCheck.js
 *
 * Copyright 2024 Justin Donnelly
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * SPDX-License-Identifier: MPL-2.0
 */

import Xdp from "gi://Xdp";

export class DependencyCheck {
    static #XDP_BACKGROUND_FLAG_AUTOSTART = 1; // https://libportal.org/flags.BackgroundFlags.html

    static async runChecks() {
        await DependencyCheck.runOnStartup();
    }

    // This is not really a dependency. But we need to run on startup to actually be useful.
    static async runOnStartup() {
        console.log('Configuring autostart');
        const portal = new Xdp.Portal();
        await portal.request_background(
            null,
            'Zone Defense must start on login',
            ['com.github.justinrdonnelly.ZoneDefense'],
            DependencyCheck.#XDP_BACKGROUND_FLAG_AUTOSTART,
            null
        );
    }
}

