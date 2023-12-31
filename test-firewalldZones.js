import GLib from 'gi://GLib';
import {FirewalldZones} from './firewalldZones.js';

async function getZoneInformation(networkInterface) {
    try {
        // Any firewalld dbus failures are considered fatal
        const [zones, defaultZone, zoneOfInterface] = await Promise.all([
            FirewalldZones.getZones(),
            FirewalldZones.getDefaultZone(),
            FirewalldZones.getZoneOfInterface(networkInterface),
        ]);
        console.log('promises!');
        console.log(`zones: ${zones}`);
        console.log(`defaultZone: ${defaultZone}`);
        console.log(`zoneOfInterface: ${zoneOfInterface}`);
    } catch (error) {
        console.log('error');
        // TODO: Is it worth checking to see if firewalld is running? It can help give a more useful error message.
    }
}

getZoneInformation('wlp5s0');

const loop = GLib.MainLoop.new(null, false);
loop.run();
