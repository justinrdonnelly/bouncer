/* networkManagerConnectionActiveProxy.js
 *
 * Copyright 2024 Justin Donnelly
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * SPDX-License-Identifier: MPL-2.0
 */

import Gio from 'gi://Gio';

// NOTE: You can ONLY HAVE ONE interface (the rest that were returned from the introspection were removed)
const networkManagerConnectionActiveInterfaceXml = '\
    <node>\
        <interface name="org.freedesktop.NetworkManager.Connection.Active">\
            <signal name="StateChanged">\
                <arg type="u" name="state"/>\
                <arg type="u" name="reason"/>\
            </signal>\
            <property type="o" name="Connection" access="read"/>\
            <property type="o" name="SpecificObject" access="read"/>\
            <property type="s" name="Id" access="read"/>\
            <property type="s" name="Uuid" access="read"/>\
            <property type="s" name="Type" access="read"/>\
            <property type="ao" name="Devices" access="read"/>\
            <property type="u" name="State" access="read"/>\
            <property type="u" name="StateFlags" access="read"/>\
            <property type="b" name="Default" access="read"/>\
            <property type="o" name="Ip4Config" access="read"/>\
            <property type="o" name="Dhcp4Config" access="read"/>\
            <property type="b" name="Default6" access="read"/>\
            <property type="o" name="Ip6Config" access="read"/>\
            <property type="o" name="Dhcp6Config" access="read"/>\
            <property type="b" name="Vpn" access="read"/>\
            <property type="o" name="Master" access="read"/>\
        </interface>\
    </node>\
';
export const NetworkManagerConnectionActiveProxy = Gio.DBusProxy.makeProxyWrapper(networkManagerConnectionActiveInterfaceXml);

