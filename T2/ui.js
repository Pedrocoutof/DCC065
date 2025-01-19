import GUI from "../../libs/util/dat.gui.module.js";
import GlobalConfig from "./GlobalConfig.js";
import Stats from 'Stats';

export function buildInterface(callback) {
    let gui = new GUI();
    
    function setupStats() {
        const stats = Stats();
        document.body.appendChild(stats.dom);
        return stats;
    }

    gui.add(GlobalConfig, 'fogValue', 0, 500).onChange(value => {
        if (callback) callback('fog', value);
    });

    const stats = setupStats();

    return { gui, stats };
}
