import GLib from 'gi://GLib';
import {NetworkState} from './networkState.js';

const networkState = new NetworkState();

setTimeout(() => {
    // console.log(`networkManager: ${networkState.networkManager}`);
    // console.log(`networkDevices: ${networkState.networkManager.networkDevices}`);
    const devices = networkState.networkManager.networkDevices;
    devices.forEach(device => {
        // console.log(`Connection: ${device.connection}`);
        console.log(`Connection ID: ${device.connection.activeConnectionId}`);
        console.log(`Settings object path: ${device.connection.activeConnectionSettings}`);
    });
}, 1000);

const loop = GLib.MainLoop.new(null, false);
loop.run();
