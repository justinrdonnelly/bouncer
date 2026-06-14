/* zoneSelection.js
 *
 * Copyright 2026 Justin Donnelly
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * SPDX-License-Identifier: MPL-2.0
 */

// These constants and functions are for use in zone dropdown menus.

const simpleZoneList = ['public', 'home', 'work'];

export const defaultZoneLabel = '[DEFAULT]';

// A null or undefined zone in NetworkManager means the default zone.
export function getZoneDisplayName(zone) {
    return zone || defaultZoneLabel;
}

// By default, we want to keep things simple for the user and only show a subset of zones. See table for behavior.
// The "Current zone" column means a named non-default zone; null is handled by the default-zone option.
// Later we may make this configurable.
/*
 *        Simple zones (simpleZoneList) all exist
 *       /    Default zone in simple zones
 *      /    /    Current zone in simple zones
 *     /    /    /
 * | SZE | DS | CS | Result                     |
 * | --- | -- | -- | -------------------------- |
 * |   F |  F |  F | All zones                  |
 * |   F |  F |  T | All zones                  |
 * |   F |  T |  F | All zones                  |
 * |   F |  T |  T | All zones                  |
 * |   T |  F |  F | Simple + Default + Current |
 * |   T |  F |  T | Simple + Default           |
 * |   T |  T |  F | Simple + Current           |
 * |   T |  T |  T | Simple                     |
 */
export function getSelectableZones(allZones, defaultZone, currentZone) {
    const simpleZonesExist = simpleZoneList.every((zone) => allZones.includes(zone));
    if (!simpleZonesExist)
        return allZones;

    const zones = [...simpleZoneList];
    const defaultZoneSimple = simpleZoneList.includes(defaultZone);
    const currentZoneSimple = simpleZoneList.includes(currentZone);
    if (!defaultZoneSimple)
        zones.push(defaultZone);
    if (currentZone && !currentZoneSimple)
        zones.push(currentZone);
    return zones.sort();
}

// Populate `zoneList` with the zones to show in the dropdown. Return the index of the current zone, or 0 for default
// if none of the listed zones match the current zone.
export function populateZoneList(zoneList, allZones, defaultZone, currentZone) {
    let selected = 0;
    const zones = getSelectableZones(allZones, defaultZone, currentZone);
    zoneList.append(defaultZoneLabel); // show the default first in the list
    zones.forEach((zone, idx) => {
        zoneList.append(zone);
        if (zone === currentZone)
            // index 0 is the default zone, and was added before we started the loop
            selected = idx + 1;
    });
    return selected;
}

export function getSelectedZone(zoneDropDown) {
    const selectedZone = zoneDropDown.get_selected_item().get_string();
    return selectedZone === defaultZoneLabel ? null : selectedZone;
}
