/* dependencyItem.js
 *
 * Copyright 2025 Justin Donnelly
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * SPDX-License-Identifier: MPL-2.0
 */

import Adw from 'gi://Adw?version=1';
import GObject from 'gi://GObject';

export const DependencyItem = GObject.registerClass(
    {
        GTypeName: 'DependencyItem',
        Template: 'resource:///io/github/justinrdonnelly/bouncer/ui/dependencyItem.ui',
        InternalChildren: ['button', 'status'],
    },
    // eslint-disable-next-line no-shadow
    class DependencyItem extends Adw.ActionRow {
        #bindings = [];

        constructor(
            title,
            dependencyCheck,
            property,
            callbackFunction,
            {
                buttonLabel = null,
                buttonSizeGroup = null,
                buttonSensitiveProperty = null,
                buttonSensitiveTransformFunction = null,
            } = {}
        ) {
            super();
            this.title = title;

            this.#bindings.push(dependencyCheck.bind_property_full(
                property,
                this._status,
                'icon-name',
                GObject.BindingFlags.SYNC_CREATE,
                // eslint-disable-next-line no-unused-vars
                (binding, value) => [true, this.#convertStatusToIcon(value)],
                null
            ));

            for (const cssClass of ['dimmed', 'success', 'warning', 'error']) {
                this.#bindings.push(Adw.bind_property_to_css_class_full(
                    dependencyCheck,
                    property,
                    this._status,
                    cssClass,
                    GObject.BindingFlags.SYNC_CREATE,
                    // eslint-disable-next-line no-unused-vars
                    (binding, value) => this.#convertStatusToCssClass(value) === cssClass,
                    null
                ));
            }

            this.#bindings.push(dependencyCheck.bind_property_full(
                property,
                this._status,
                'tooltip-text',
                GObject.BindingFlags.SYNC_CREATE,
                // eslint-disable-next-line no-unused-vars
                (binding, value) => [true, this.#convertStatusToText(value)],
                null
            ));

            this.#bindings.push(dependencyCheck.bind_property_full(
                property,
                this,
                'subtitle',
                GObject.BindingFlags.SYNC_CREATE,
                // eslint-disable-next-line no-unused-vars
                (binding, value) => [true, this.#convertStatusToText(value)],
                null
            ));

            if (buttonLabel !== null)
                this._button.label = buttonLabel;
            buttonSizeGroup?.add_widget(this._button);
            this._button.connect('clicked', callbackFunction);
            if (buttonSensitiveProperty !== null) {
                this.#bindings.push(dependencyCheck.bind_property_full(
                    buttonSensitiveProperty,
                    this._button,
                    'sensitive',
                    GObject.BindingFlags.SYNC_CREATE,
                    // eslint-disable-next-line no-unused-vars
                    (binding, value) => [
                        true,
                        buttonSensitiveTransformFunction === null ? value : buttonSensitiveTransformFunction(value),
                    ],
                    null
                ));
            }
        }

        cleanup() {
            this.#bindings.forEach(binding => binding.unbind());
            this.#bindings = [];
        }

        #convertStatusToText(status) {
            switch (status) {
                case 0:
                    return _('Unknown');
                case 1:
                    return _('Ready');
                case 2:
                    return _('Suboptimal');
                case 3:
                    return _('Not Ready');
                default:
                    console.error(`Invalid DependencyItem status: ${status}`);
                    return _('Unknown');
            }
        }

        #convertStatusToIcon(status) {
            switch (status) {
                case 0:
                    return 'dialog-question-symbolic';
                case 1:
                    return 'object-select-symbolic';
                case 2:
                    return 'dialog-warning-symbolic';
                case 3:
                    return 'dialog-error-symbolic';
                default:
                    console.error(`Invalid DependencyItem status: ${status}`);
                    return 'dialog-question-symbolic';
            }
        }

        #convertStatusToCssClass(status) {
            switch (status) {
                case 0:
                    return 'dimmed';
                case 1:
                    return 'success';
                case 2:
                    return 'warning';
                case 3:
                    return 'error';
                default:
                    console.error(`Invalid DependencyItem status: ${status}`);
                    return 'dimmed';
            }
        }
    }
);
