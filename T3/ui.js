import GUI from "GUI";
import GlobalConfig from "./GlobalConfig.js";
import Stats from 'Stats';
import { InfoBox } from 'util';

export function buildInterface(callback) {
    let gui = new GUI();
    let controls = new InfoBox();
    controls.add("H: Alternar HUD");
    controls.add("Y: Inverter eixo Y");
    controls.add("C: Alternar camera");
    controls.show();
    
    function setupStats() {
        const stats = Stats();
        document.body.appendChild(stats.dom);
        return stats;
    }

    gui.add(GlobalConfig, 'fogValue', 0, 350).onChange(value => {
        if (callback) callback('fog', value);
    });

    const stats = setupStats();

    return { gui, stats };
}
