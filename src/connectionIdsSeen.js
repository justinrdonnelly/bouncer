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

import { Data } from './data.js';

export class ConnectionIdsSeen {
    #connectionIdsSeen;
    #data;
    #fileName = 'connection-ids-seen.json';

    constructor() {
        this.#data = new Data(this.#fileName);
    }

    // Always call init immediately after constructor.
    async init() {
        this.#data.init();
        this.#connectionIdsSeen = await this.#data.getData();
    }

    isConnectionNew(connectionId) {
        console.log(`Checking to see if connection ${connectionId} is new.`);
        const isNew = !this.#connectionIdsSeen.includes(connectionId);
        console.log(`Connection ${connectionId} is ${isNew ? '' : 'not '}new.`);
        return isNew;
    }

    addConnectionIdToSeen(connectionId) {
        console.log(`Adding ${connectionId} to ${this.#fileName}.`);
        this.#connectionIdsSeen.push(connectionId);
    }

    async syncConnectionIdToSeen() {
        // Don't try/catch here. Allow it to propagate.
        const dataJSON = JSON.stringify(this.#connectionIdsSeen);
        this.#data.saveData(dataJSON);
    }

}
