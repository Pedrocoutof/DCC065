import GUI from "../../libs/util/dat.gui.module.js";

export function buildInterface(callback) {
    let gui = new GUI();
    gui.add(
        {
            loadScene: () => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".json";

                input.addEventListener("change", (event) => {
                    const file = event.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            try {
                                const data = JSON.parse(e.target.result);
                                callback(data);
                            } catch (error) {
                                console.error("Erro ao ler o JSON:", error);
                            }
                        };
                        reader.readAsText(file);
                    }
                });
                input.click();
            },
        },
        "loadScene"
    ).name("Carregar modelagem");
}
