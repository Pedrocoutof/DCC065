
import { InfoBox } from 'util';

let controls = new InfoBox();
controls.add("Ambiente de Modelagem");
controls.addParagraph();
controls.add("Controles:");
controls.add("* Setas: mover no plano XZ");
controls.add("* PgUp/PgDown: mover em Y");
controls.add("* Q: adicionar voxel");
controls.add("* E: remover voxel");
controls.add("* . / ,: trocar tipo de voxel");
controls.add("* S: salvar cena");
controls.add("* L: carregar cena");
controls.show();

export { controls };