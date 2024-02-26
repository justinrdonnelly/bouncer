/* window.js
 *
 * Copyright 2024 Justin
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * SPDX-License-Identifier: MPL-2.0
 */

import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';

export const ZoneDefenseWindow = GObject.registerClass({
    GTypeName: 'ZoneDefenseWindow',
    Template: 'resource:///com/github/justinrdonnelly/ZoneDefense/window.ui',
    Properties: {
        'example-property': GObject.ParamSpec.string(
            'example-property',
            'Example Property',
            'A read-write string property',
            GObject.ParamFlags.READWRITE,
            null
        ),
    }, InternalChildren: ['networkLabel'],
}, class ZoneDefenseWindow extends Adw.ApplicationWindow {
    constructor(application, value) {
        super({ application });
        this.example_property = `<span size="x-small">You are connected to: ${value}</span>`; // go through the setter to call `notify`
    }
    set example_property(value) {
        if (this.example_property === value) // Is it intentional to go through the getter? https://gjs.guide/guides/gobject/subclassing.html#declaring-properties
            return;
        this._example_property = value;
        this.notify('example-property');
    }
    get example_property() {
        if (this._example_property === undefined)
            this._example_property = null;
        return this._example_property;
    }
});

