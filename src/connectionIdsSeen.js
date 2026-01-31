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
    static #fileName = 'connection-ids-seen.json';
    #connectionIdsSeen;
    #data;

    constructor() {
        this.#data = new Data(ConnectionIdsSeen.#fileName);
    }

    // Always call init immediately after constructor.
    async init() {
        const data = await this.#data.getData();
        if (data === null)
            this.#connectionIdsSeen = [];
        else
            this.#connectionIdsSeen = JSON.parse(data);
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
        const dataJSON = JSON.stringify(this.#connectionIdsSeen);
        this.#data.saveData(dataJSON);
    }

}
