import GLib from 'gi://GLib';
import {NetworkManagerZoneForConnection} from './networkManagerZoneForConnection.js';

async function getZone(objectPath) {
    try {
        const zone = await NetworkManagerZoneForConnection.getZone(objectPath)
        console.log('promise!');
        console.log(`zone: ${zone}`);
    } catch (error) {
        console.log('error - outermost catch');
        console.log(error);
    }
}

async function updateZone(objectPath) {
    let zone;
    let newZone;
    try {
        zone = await NetworkManagerZoneForConnection.getZone(objectPath)
        console.log('promise!');
        console.log(`zone before: ${zone}`);
    } catch (error) {
        console.log('error - outermost catch');
        console.log(error);
    }
    if (zone === 'trusted') {
        newZone = 'public'
    } else {
        newZone = 'trusted'
    }
    newZone = 'public';
    try { // TODO: I don't think I should need this. Just use 1 bigger try.
        await NetworkManagerZoneForConnection.setZone(objectPath, newZone);
    } catch (error) {
        console.log('error - outermost catch');
        console.log(error);
    }
    try { // TODO: I don't think I should need this. Just use 1 bigger try.
        zone = await NetworkManagerZoneForConnection.getZone(objectPath)
        console.log('promise!');
        console.log(`zone after: ${zone}`);
    } catch (error) {
        console.log('error - outermost catch');
        console.log(error);
    }
}

// Settings/5 is the NM configuration settings for the wireless connection I am using for testing.
// Normally, this object path would have to come from networkState.js

//getZone('/org/freedesktop/NetworkManager/Settings/5');
updateZone('/org/freedesktop/NetworkManager/Settings/5');

const loop = GLib.MainLoop.new(null, false);
loop.run();
