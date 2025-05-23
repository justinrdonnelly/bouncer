/* networkManagerProxy.js
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
const networkManagerInterfaceXml =
    '\
    <node>\
        <interface name="org.freedesktop.NetworkManager">\
            <method name="Reload">\
                <arg type="u" name="flags" direction="in"/>\
            </method>\
            <method name="GetDevices">\
                <arg type="ao" name="devices" direction="out"/>\
            </method>\
            <method name="GetAllDevices">\
                <arg type="ao" name="devices" direction="out"/>\
            </method>\
            <method name="GetDeviceByIpIface">\
                <arg type="s" name="iface" direction="in"/>\
                <arg type="o" name="device" direction="out"/>\
            </method>\
            <method name="ActivateConnection">\
                <arg type="o" name="connection" direction="in"/>\
                <arg type="o" name="device" direction="in"/>\
                <arg type="o" name="specific_object" direction="in"/>\
                <arg type="o" name="active_connection" direction="out"/>\
            </method>\
            <method name="AddAndActivateConnection">\
                <arg type="a{sa{sv}}" name="connection" direction="in"/>\
                <arg type="o" name="device" direction="in"/>\
                <arg type="o" name="specific_object" direction="in"/>\
                <arg type="o" name="path" direction="out"/>\
                <arg type="o" name="active_connection" direction="out"/>\
            </method>\
            <method name="AddAndActivateConnection2">\
                <arg type="a{sa{sv}}" name="connection" direction="in"/>\
                <arg type="o" name="device" direction="in"/>\
                <arg type="o" name="specific_object" direction="in"/>\
                <arg type="a{sv}" name="options" direction="in"/>\
                <arg type="o" name="path" direction="out"/>\
                <arg type="o" name="active_connection" direction="out"/>\
                <arg type="a{sv}" name="result" direction="out"/>\
            </method>\
            <method name="DeactivateConnection">\
                <arg type="o" name="active_connection" direction="in"/>\
            </method>\
            <method name="Sleep">\
                <arg type="b" name="sleep" direction="in"/>\
            </method>\
            <method name="Enable">\
                <arg type="b" name="enable" direction="in"/>\
            </method>\
            <method name="GetPermissions">\
                <arg type="a{ss}" name="permissions" direction="out"/>\
            </method>\
            <method name="SetLogging">\
                <arg type="s" name="level" direction="in"/>\
                <arg type="s" name="domains" direction="in"/>\
            </method>\
            <method name="GetLogging">\
                <arg type="s" name="level" direction="out"/>\
                <arg type="s" name="domains" direction="out"/>\
            </method>\
            <method name="CheckConnectivity">\
                <arg type="u" name="connectivity" direction="out"/>\
            </method>\
            <method name="state">\
                <arg type="u" name="state" direction="out"/>\
            </method>\
            <method name="CheckpointCreate">\
                <arg type="ao" name="devices" direction="in"/>\
                <arg type="u" name="rollback_timeout" direction="in"/>\
                <arg type="u" name="flags" direction="in"/>\
                <arg type="o" name="checkpoint" direction="out"/>\
            </method>\
            <method name="CheckpointDestroy">\
                <arg type="o" name="checkpoint" direction="in"/>\
            </method>\
            <method name="CheckpointRollback">\
                <arg type="o" name="checkpoint" direction="in"/>\
                <arg type="a{su}" name="result" direction="out"/>\
            </method>\
            <method name="CheckpointAdjustRollbackTimeout">\
                <arg type="o" name="checkpoint" direction="in"/>\
                <arg type="u" name="add_timeout" direction="in"/>\
            </method>\
            <signal name="CheckPermissions"/>\
            <signal name="StateChanged">\
                <arg type="u" name="state"/>\
            </signal>\
            <signal name="DeviceAdded">\
                <arg type="o" name="device_path"/>\
            </signal>\
            <signal name="DeviceRemoved">\
                <arg type="o" name="device_path"/>\
            </signal>\
            <property type="ao" name="Devices" access="read"/>\
            <property type="ao" name="AllDevices" access="read"/>\
            <property type="ao" name="Checkpoints" access="read"/>\
            <property type="b" name="NetworkingEnabled" access="read"/>\
            <property type="b" name="WirelessEnabled" access="readwrite"/>\
            <property type="b" name="WirelessHardwareEnabled" access="read"/>\
            <property type="b" name="WwanEnabled" access="readwrite"/>\
            <property type="b" name="WwanHardwareEnabled" access="read"/>\
            <property type="b" name="WimaxEnabled" access="readwrite"/>\
            <property type="b" name="WimaxHardwareEnabled" access="read"/>\
            <property type="u" name="RadioFlags" access="read"/>\
            <property type="ao" name="ActiveConnections" access="read"/>\
            <property type="o" name="PrimaryConnection" access="read"/>\
            <property type="s" name="PrimaryConnectionType" access="read"/>\
            <property type="u" name="Metered" access="read"/>\
            <property type="o" name="ActivatingConnection" access="read"/>\
            <property type="b" name="Startup" access="read"/>\
            <property type="s" name="Version" access="read"/>\
            <property type="au" name="Capabilities" access="read"/>\
            <property type="u" name="State" access="read"/>\
            <property type="u" name="Connectivity" access="read"/>\
            <property type="b" name="ConnectivityCheckAvailable" access="read"/>\
            <property type="b" name="ConnectivityCheckEnabled" access="readwrite"/>\
            <property type="s" name="ConnectivityCheckUri" access="read"/>\
            <property type="a{sv}" name="GlobalDnsConfiguration" access="readwrite"/>\
        </interface>\
        <node name="IP4Config"/>\
        <node name="ActiveConnection"/>\
        <node name="AgentManager"/>\
        <node name="Devices"/>\
        <node name="DHCP4Config"/>\
        <node name="DnsManager"/>\
        <node name="IP6Config"/>\
        <node name="Settings"/>\
    </node>\
    ';
export const NetworkManagerProxy = Gio.DBusProxy.makeProxyWrapper(networkManagerInterfaceXml);
