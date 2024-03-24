/* networkManagerDeviceProxy.js
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
const networkManagerDeviceInterfaceXml = '\
    <node>\
        <interface name="org.freedesktop.NetworkManager.Device">\
            <method name="Reapply">\
                <arg type="a{sa{sv}}" name="connection" direction="in"/>\
                <arg type="t" name="version_id" direction="in"/>\
                <arg type="u" name="flags" direction="in"/>\
            </method>\
            <method name="GetAppliedConnection">\
                <arg type="u" name="flags" direction="in"/>\
                <arg type="a{sa{sv}}" name="connection" direction="out"/>\
                <arg type="t" name="version_id" direction="out"/>\
            </method>\
            <method name="Disconnect"/>\
            <method name="Delete"/>\
            <signal name="StateChanged">\
                <arg type="u" name="new_state"/>\
                <arg type="u" name="old_state"/>\
                <arg type="u" name="reason"/>\
            </signal>\
            <property type="s" name="Udi" access="read"/>\
            <property type="s" name="Path" access="read"/>\
            <property type="s" name="Interface" access="read"/>\
            <property type="s" name="IpInterface" access="read"/>\
            <property type="s" name="Driver" access="read"/>\
            <property type="s" name="DriverVersion" access="read"/>\
            <property type="s" name="FirmwareVersion" access="read"/>\
            <property type="u" name="Capabilities" access="read"/>\
            <property type="u" name="Ip4Address" access="read"/>\
            <property type="u" name="State" access="read"/>\
            <property type="(uu)" name="StateReason" access="read"/>\
            <property type="o" name="ActiveConnection" access="read"/>\
            <property type="o" name="Ip4Config" access="read"/>\
            <property type="o" name="Dhcp4Config" access="read"/>\
            <property type="o" name="Ip6Config" access="read"/>\
            <property type="o" name="Dhcp6Config" access="read"/>\
            <property type="b" name="Managed" access="readwrite"/>\
            <property type="b" name="Autoconnect" access="readwrite"/>\
            <property type="b" name="FirmwareMissing" access="read"/>\
            <property type="b" name="NmPluginMissing" access="read"/>\
            <property type="u" name="DeviceType" access="read"/>\
            <property type="ao" name="AvailableConnections" access="read"/>\
            <property type="s" name="PhysicalPortId" access="read"/>\
            <property type="u" name="Mtu" access="read"/>\
            <property type="u" name="Metered" access="read"/>\
            <property type="aa{sv}" name="LldpNeighbors" access="read"/>\
            <property type="b" name="Real" access="read"/>\
            <property type="u" name="Ip4Connectivity" access="read"/>\
            <property type="u" name="Ip6Connectivity" access="read"/>\
            <property type="u" name="InterfaceFlags" access="read"/>\
            <property type="s" name="HwAddress" access="read"/>\
            <property type="ao" name="Ports" access="read"/>\
        </interface>\
    </node>\
';
export const NetworkManagerDeviceProxy = Gio.DBusProxy.makeProxyWrapper(networkManagerDeviceInterfaceXml);

