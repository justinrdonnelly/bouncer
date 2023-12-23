import GLib from 'gi://GLib';
import {NetworkState} from './networkState.js';


new NetworkState();

const loop = GLib.MainLoop.new(null, false);
loop.run();
