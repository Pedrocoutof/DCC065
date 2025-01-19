import GUI from "../../libs/util/dat.gui.module.js";
import GlobalConfig from "./GlobalConfig.js";
import Stats from 'Stats';

export function buildInterface(callback) {
    let gui = new GUI();
    
    // Configuração do nevoeiro
    function setupFogFolder(gui, config, callback) {
        const fogFolder = gui.addFolder('FOG');
        fogFolder.add(config, 'fogValue', 0, 500).onChange(value => {
            if (callback) callback('fog', value);
        });
    }
    
    // Configuração de estatísticas
    function setupStats() {
        const stats = Stats();
        document.body.appendChild(stats.dom);
        return stats;
    }

    // Configuração de controles adicionais (Exemplo: Velocidade de movimento)
    function setupMovementFolder(gui, config, callback) {
        const movementFolder = gui.addFolder('MOVEMENT');
        movementFolder.add(config.movement, 'speed', 1, 10).onChange(value => {
            if (callback) callback('speed', value);
        });
        movementFolder.add(config.movement, 'runningConst', 1, 5).onChange(value => {
            if (callback) callback('runningConst', value);
        });
    }

    // Inicialização de todos os controles
    setupFogFolder(gui, GlobalConfig, callback);
    setupMovementFolder(gui, GlobalConfig, callback);
    const stats = setupStats();

    return { gui, stats };  // Retorna para possível uso externo
}
