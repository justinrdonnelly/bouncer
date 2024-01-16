import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import {NetworkState} from './networkState.js';

export default class ZoneDefenseExtension extends Extension {
    enable() {
        this._networkState = new NetworkState();
        this._handlerId = this._networkState.networkManager.connectItem(this.interfaceChanged.bind(this));
    }

    disable() {
        this._networkState.networkManager.destroy();
    }

    interfaceChanged() {
        console.log('interface changed!');
        const devices = this._networkState.networkManager.networkDevices;
        devices.forEach(device => {
            // console.log(`Connection: ${device.connection}`);
            console.log(`Connection ID: ${device.connection.activeConnectionId}`);
            console.log(`Settings object path: ${device.connection.activeConnectionSettings}`);
            });
    }
}
