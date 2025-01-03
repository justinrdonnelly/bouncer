/* errorSignal.js
 *
 * Copyright 2025 Justin Donnelly
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * SPDX-License-Identifier: MPL-2.0
 */

import GObject from 'gi://GObject';

export const ErrorSignal = GObject.registerClass({
    Signals: {
        'error': {
            param_types: [
                GObject.TYPE_BOOLEAN, // Whether the error should be considered fatal. This may be ignored.
                GObject.TYPE_STRING, // Error ID. This is often used for the notification ID.
                GObject.TYPE_STRING, // Error title. This is often used for the notification title.
                GObject.TYPE_STRING // Error message. A longer error message. This is often used for notification body.
            ],
        },
    },
}, class ErrorSignal extends GObject.Object {
    emit(fatal, errorId, errorTitle, errorMessage) {
        super.emit('error', fatal, errorId, errorTitle, errorMessage)
    }
});
