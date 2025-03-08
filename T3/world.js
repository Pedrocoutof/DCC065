import * as THREE from "three";
import { SimplexNoise } from "simplexNoise";
import { setDefaultMaterial } from "util";

export class World extends THREE.Group {
  data = [];

  params = {
    terrains: {
      scale: 100,
      magnitude: 0.4,
      offset: 0.4,
    },
    biome: {
      sandLevel: 2,
      stoneLevel: 3,
    },
  };

  constructor(scene, size = { width: 256, height: 20 }) {
    super();
    this.scene = scene; // Armazena a cena passada como parâmetro
    this.size = size;
    this.textureLoader = new THREE.TextureLoader();
    this.grassTexture = this.textureLoader.load("./assets/grass.jpg");
    this.groundTexture = this.textureLoader.load("./assets/ground.jpg");
    this.wood1Texture = this.textureLoader.load("./assets/wood1.jpg");
    this.wood2Texture = this.textureLoader.load("./assets/wood2.jpg");
    this.forestTexture = this.textureLoader.load("./assets/forest.jpg");
    this.orangeTexture = this.textureLoader.load("./assets/orange.jpg");
    this.darkgreenTexture = this.textureLoader.load("./assets/darkgreen.jpg");

    this.wood1Texture.wrapS = THREE.RepeatWrapping;
    this.wood1Texture.wrapT = THREE.RepeatWrapping;
    this.wood1Texture.repeat.set(1, 3);

    this.wood2Texture.wrapS = THREE.RepeatWrapping;
    this.wood2Texture.wrapT = THREE.RepeatWrapping;
    this.wood2Texture.repeat.set(1, 3);

    this.initTerrain();
    this.initSkybox(); // Inicializa a skybox
    this.initFog(); // Inicializa o fog

    window.addEventListener("keydown", (event) => this.onKeyDown(event));
  }

  setBlockId(x, y, z, instanceId) {
    if (this.inBounds(x, z, y)) {
      this.data[x][z][y].instanceId = instanceId;
    }
  }

  initFog() {
    this.fog = new THREE.Fog(0x87ceeb, 100, 500); // Cor do fog, distância inicial, distância final
    this.scene.fog = this.fog; // Aplica o fog à cena
    this.fogEnabled = true; // Estado inicial do fog
  }

  onKeyDown(event) {
    if (event.key === "f" || event.key === "F") {
      this.toggleFog();
    }
  }

  toggleFog() {
    this.fogEnabled = !this.fogEnabled;
    this.scene.fog = this.fogEnabled ? this.fog : null;
  }

  initSkybox() {
    const skyboxGeometry = new THREE.BoxGeometry(1000, 1000, 1000); // Tamanho da skybox
    const skyboxMaterials = [
      new THREE.MeshBasicMaterial({
        map: this.textureLoader.load("./assets/sky.jpg"),
        side: THREE.BackSide,
      }), // Direita
      new THREE.MeshBasicMaterial({
        map: this.textureLoader.load("./assets/sky.jpg"),
        side: THREE.BackSide,
      }), // Esquerda
      new THREE.MeshBasicMaterial({
        map: this.textureLoader.load("./assets/sky.jpg"),
        side: THREE.BackSide,
      }), // Topo
      new THREE.MeshBasicMaterial({
        map: this.textureLoader.load("./assets/sky.jpg"),
        side: THREE.BackSide,
      }), // Base
      new THREE.MeshBasicMaterial({
        map: this.textureLoader.load("./assets/sky.jpg"),
        side: THREE.BackSide,
      }), // Frente
      new THREE.MeshBasicMaterial({
        map: this.textureLoader.load("./assets/sky.jpg"),
        side: THREE.BackSide,
      }), // Trás
    ];

    const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterials);
    this.add(skybox);
  }

  setBlockType(x, y, z, type) {
    if (this.inBounds(x, z, y)) {
        this.data[x][z][y].type = type; // Atribui o tipo ao bloco
    }
}

  inBounds(x, z, y) {
    return (
      x >= 0 &&
      x < this.size.width &&
      z >= 0 &&
      z < this.size.width &&
      y >= 0 &&
      y < this.size.height
    );
  }

  hasVoxel(x, z, y) {
    return this.data[x][z][y] && this.data[x][z][y].instanceId ? true : false;
  }

  generate() {
    this.clear();
    this.generateTerrain();
    this.generateMesh();
  }

  getCenterMap() {
    return {
      x: this.size.width / 2,
      z: this.size.width / 2,
      y: this.size.height / 2,
    };
  }

  getHeightByXZ(x, z) {
    let i = 1;
    while (this.hasVoxel(x, z, i)) {
      i++;
    }
    return i;
  }

  initTerrain() {
    this.data = [];
    for (let x = 0; x < this.size.width; x++) {
        const slice = [];
        for (let z = 0; z < this.size.width; z++) {
            const row = [];
            for (let y = 0; y < this.size.height; y++) {
                row.push({
                    id: 0,
                    instanceId: null,
                    type: null // Inicializa o tipo como null
                });
            }
            slice.push(row);
        }
        this.data.push(slice);
    }
}

  generateTerrain() {
    const simplex = new SimplexNoise();
    const waterLevel = 3; // Define o nível da água

    for (let x = 0; x < this.size.width; x++) {
        for (let z = 0; z < this.size.width; z++) {
            const value = simplex.noise(
                x / this.params.terrains.scale,
                z / this.params.terrains.scale
            );
            const scaledNoise =
                this.params.terrains.offset + this.params.terrains.magnitude * value;
            let height = Math.floor(this.size.height * scaledNoise);
            height = Math.max(1, Math.min(height, this.size.height));

            // Gerar o terreno
            for (let y = 0; y < height; y++) {
                if (y === 0) {
                    this.setBlockType(x, y, z, "stone");
                } else if (y < this.params.biome.sandLevel) {
                    this.setBlockType(x, y, z, "sand");
                } else if (y < this.params.biome.stoneLevel) {
                    this.setBlockType(x, y, z, "dirt");
                } else {
                    this.setBlockType(x, y, z, "grass");
                }
                this.setBlockId(x, y, z, 1);
            }

            // Adicionar água nos vales
            if (height < waterLevel) {
                for (let y = height; y < waterLevel; y++) {
                    this.setBlockType(x, y, z, "water");
                    this.setBlockId(x, y, z, 1);
                }
            }
        }
    }
}

  generateMeshVoxel(type) {
    const maxCount = this.size.width * this.size.width * this.size.height;
    const voxelGeometry = new THREE.BoxGeometry(1, 1, 1);

    let materials;

    if (type === "grass") {
      materials = [
        new THREE.MeshLambertMaterial({ map: this.groundTexture }), // Lado esquerdo
        new THREE.MeshLambertMaterial({ map: this.groundTexture }), // Lado direito
        new THREE.MeshLambertMaterial({ map: this.grassTexture }), // Topo
        new THREE.MeshLambertMaterial({ map: this.groundTexture }), // Base
        new THREE.MeshLambertMaterial({ map: this.groundTexture }), // Frente
        new THREE.MeshLambertMaterial({ map: this.groundTexture }), // Trás
      ];
    } else if (type === "dirt") {
      materials = [
        new THREE.MeshLambertMaterial({ map: this.groundTexture }), // Lado esquerdo
        new THREE.MeshLambertMaterial({ map: this.groundTexture }), // Lado direito
        new THREE.MeshLambertMaterial({ map: this.groundTexture }), // Topo
        new THREE.MeshLambertMaterial({ map: this.groundTexture }), // Base
        new THREE.MeshLambertMaterial({ map: this.groundTexture }), // Frente
        new THREE.MeshLambertMaterial({ map: this.groundTexture }), // Trás
      ];
    } else if (type === "water") {
      const waterTexture = this.textureLoader.load("./assets/water.jpg");
      materials = new THREE.MeshLambertMaterial({
        map: waterTexture,
        transparent: true,
        opacity: 0.7, // Define a transparência da água
      });
    } else {
      // Para outros tipos de blocos, use um material padrão
      materials = new THREE.MeshLambertMaterial({ color: 0xffffff });
    }

    // Cria dois InstancedMesh: um para blocos no topo (com sombras) e outro para blocos internos (sem sombras)
    const meshWithShadows = new THREE.InstancedMesh(
      voxelGeometry,
      materials,
      maxCount
    );
    const meshWithoutShadows = new THREE.InstancedMesh(
      voxelGeometry,
      materials,
      maxCount
    );

    // Configura sombras
    meshWithShadows.castShadow = true;
    meshWithShadows.receiveShadow = true;
    meshWithoutShadows.castShadow = false;
    meshWithoutShadows.receiveShadow = false;

    // Adiciona fog a ambos
    meshWithShadows.fog = true;
    meshWithoutShadows.fog = true;

    return {
      withShadows: meshWithShadows,
      withoutShadows: meshWithoutShadows,
    };
  }

  generateMesh() {
    const grassMeshes = this.generateMeshVoxel("grass");
    grassMeshes.withShadows.count = 0;
    grassMeshes.withoutShadows.count = 0;

    const dirtMeshes = this.generateMeshVoxel("dirt");
    dirtMeshes.withShadows.count = 0;
    dirtMeshes.withoutShadows.count = 0;

    const stoneMeshes = this.generateMeshVoxel("stone");
    stoneMeshes.withShadows.count = 0;
    stoneMeshes.withoutShadows.count = 0;

    const sandMeshes = this.generateMeshVoxel("sand");
    sandMeshes.withShadows.count = 0;
    sandMeshes.withoutShadows.count = 0;

    const waterMeshes = this.generateMeshVoxel("water");
    waterMeshes.withShadows.count = 0;
    waterMeshes.withoutShadows.count = 0;

    const typesMeshes = {
      grass: grassMeshes,
      dirt: dirtMeshes,
      stone: stoneMeshes,
      sand: sandMeshes,
      water: waterMeshes,
    };

    const matrix = new THREE.Matrix4();

    for (let x = 0; x < this.size.width; x++) {
      for (let z = 0; z < this.size.width; z++) {
        for (let y = 0; y < this.size.height; y++) {
          if (this.data[x][z][y].instanceId !== null) {
            matrix.setPosition(x + 0.5, y + 0.5, z + 0.5);

            const type = this.data[x][z][y].type;
            const meshes = typesMeshes[type];

            // Verifica se o bloco está no topo
            const isTopBlock = !this.hasVoxel(x, z, y + 1);

            if (meshes) {
              if (isTopBlock) {
                // Adiciona ao InstancedMesh com sombras
                meshes.withShadows.setMatrixAt(
                  meshes.withShadows.count++,
                  matrix
                );
              } else {
                // Adiciona ao InstancedMesh sem sombras
                meshes.withoutShadows.setMatrixAt(
                  meshes.withoutShadows.count++,
                  matrix
                );
              }
            }

            if (type === "grass" && Math.random() < 0.003 && isTopBlock) {
              if (!this.hasVoxel(x, z, y + 1)) {
                const terrainHeight = this.getHeightByXZ(x, z);
                const tree = this.generateRandomThree(
                  Math.floor(x),
                  terrainHeight,
                  Math.floor(z)
                );
                this.add(tree);
              }
            }
          }
        }
      }
    }

    // Adiciona todos os InstancedMesh à cena
    this.add(grassMeshes.withShadows);
    this.add(grassMeshes.withoutShadows);
    this.add(dirtMeshes.withShadows);
    this.add(dirtMeshes.withoutShadows);
    this.add(stoneMeshes.withShadows);
    this.add(stoneMeshes.withoutShadows);
    this.add(sandMeshes.withShadows);
    this.add(sandMeshes.withoutShadows);
    this.add(waterMeshes.withShadows);
    this.add(waterMeshes.withoutShadows);
  }

  generateRandomThree(x, y, z) {
    let rand = Math.random();
    let basePosition = { x, y, z };

    if (rand < 0.33) {
      return this.loadTreeFromFile("./assets/autumn.json", basePosition);
    } else if (rand < 0.66) {
      return this.loadTreeFromFile("./assets/oak.json", basePosition);
    } else {
      return this.loadTreeFromFile("./assets/default.json", basePosition);
    }
  }

  async loadTreeFromFile(fileName, basePosition) {
    try {
      const response = await fetch(fileName);
      if (!response.ok) {
        throw new Error(`Erro ao carregar o arquivo: ${fileName}`);
      }
      const treeData = await response.json();
      this.buildModeling(treeData, basePosition);
    } catch (error) {
      console.error("Erro ao carregar a árvore:", error);
    }
  }

  buildModeling(data, basePosition) {
    data.forEach((voxelData) => {
      const geometry = new THREE.BoxGeometry(
        voxelData.additionalData.width,
        voxelData.additionalData.height,
        voxelData.additionalData.depth
      );

      let voxelMaterial;

      // Verifica se o bloco é parte do tronco
      if (voxelData.additionalData.name === "oak") {
        // Aplica texturas diferentes para cada face do tronco
        voxelMaterial = [
          new THREE.MeshLambertMaterial({ map: this.wood1Texture }), // Lado esquerdo
          new THREE.MeshLambertMaterial({ map: this.wood1Texture }), // Lado direito
          new THREE.MeshLambertMaterial({ map: this.wood2Texture }), // Topo
          new THREE.MeshLambertMaterial({ map: this.wood2Texture }), // Base
          new THREE.MeshLambertMaterial({ map: this.wood1Texture }), // Frente
          new THREE.MeshLambertMaterial({ map: this.wood1Texture }), // Trás
        ];
      } else if (voxelData.additionalData.name === "wood") {
        voxelMaterial = [
          new THREE.MeshLambertMaterial({ map: this.wood1Texture }), // Lado esquerdo
          new THREE.MeshLambertMaterial({ map: this.wood1Texture }), // Lado direito
          new THREE.MeshLambertMaterial({ map: this.wood2Texture }), // Topo
          new THREE.MeshLambertMaterial({ map: this.wood2Texture }), // Base
          new THREE.MeshLambertMaterial({ map: this.wood1Texture }), // Frente
          new THREE.MeshLambertMaterial({ map: this.wood1Texture }), // Trás
        ];
      } else if (voxelData.additionalData.name === "darkgreen") {
        voxelMaterial = [
          new THREE.MeshLambertMaterial({
            map: this.darkgreenTexture,
            transparent: true,
            opacity: 0.7,
            depthWrite: false,
          }), // Lado esquerdo
          new THREE.MeshLambertMaterial({
            map: this.darkgreenTexture,
            transparent: true,
            opacity: 0.7,
            depthWrite: false,
          }), // Lado direito
          new THREE.MeshLambertMaterial({
            map: this.darkgreenTexture,
            transparent: true,
            opacity: 0.7,
            depthWrite: false,
          }), // Topo
          new THREE.MeshLambertMaterial({
            map: this.darkgreenTexture,
            transparent: true,
            opacity: 0.7,
            depthWrite: false,
          }), // Base
          new THREE.MeshLambertMaterial({
            map: this.darkgreenTexture,
            transparent: true,
            opacity: 0.7,
            depthWrite: false,
          }), // Frente
          new THREE.MeshLambertMaterial({
            map: this.darkgreenTexture,
            transparent: true,
            opacity: 0.7,
            depthWrite: false,
          }), // Trás
        ];
      } else if (voxelData.additionalData.name === "orange") {
        voxelMaterial = [
          new THREE.MeshLambertMaterial({
            map: this.orangeTexture,
            transparent: true,
            opacity: 0.7,
            depthWrite: false,
          }), // Lado esquerdo
          new THREE.MeshLambertMaterial({
            map: this.orangeTexture,
            transparent: true,
            opacity: 0.7,
            depthWrite: false,
          }), // Lado direito
          new THREE.MeshLambertMaterial({
            map: this.orangeTexture,
            transparent: true,
            opacity: 0.7,
            depthWrite: false,
          }), // Topo
          new THREE.MeshLambertMaterial({
            map: this.orangeTexture,
            transparent: true,
            opacity: 0.7,
            depthWrite: false,
          }), // Base
          new THREE.MeshLambertMaterial({
            map: this.orangeTexture,
            transparent: true,
            opacity: 0.7,
            depthWrite: false,
          }), // Frente
          new THREE.MeshLambertMaterial({
            map: this.orangeTexture,
            transparent: true,
            opacity: 0.7,
            depthWrite: false,
          }), // Trás
        ];
      } else if (voxelData.additionalData.name === "forestgreen") {
        voxelMaterial = [
          new THREE.MeshLambertMaterial({
            map: this.forestTexture,
            transparent: true,
            opacity: 0.7,
            depthWrite: false,
          }), // Lado esquerdo
          new THREE.MeshLambertMaterial({
            map: this.forestTexture,
            transparent: true,
            opacity: 0.7,
            depthWrite: false,
          }), // Lado direito
          new THREE.MeshLambertMaterial({
            map: this.forestTexture,
            transparent: true,
            opacity: 0.7,
            depthWrite: false,
          }), // Topo
          new THREE.MeshLambertMaterial({
            map: this.forestTexture,
            transparent: true,
            opacity: 0.7,
            depthWrite: false,
          }), // Base
          new THREE.MeshLambertMaterial({
            map: this.forestTexture,
            transparent: true,
            opacity: 0.7,
            depthWrite: false,
          }), // Frente
          new THREE.MeshLambertMaterial({
            map: this.forestTexture,
            transparent: true,
            opacity: 0.7,
            depthWrite: false,
          }), // Trás
        ];
      } else {
        // Para outros blocos (folhagem), usa a cor definida no JSON
        voxelMaterial = setDefaultMaterial(
          voxelData.materialProps.color || 0xffffff
        );
      }

      const mesh = new THREE.Mesh(geometry, voxelMaterial);

      if (mesh instanceof THREE.Mesh) {
        mesh.position.set(
          voxelData.position.x + basePosition.x,
          voxelData.position.y + basePosition.y,
          voxelData.position.z + basePosition.z
        );
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        this.setBlockId(
          Math.floor(voxelData.position.x + basePosition.x),
          Math.floor(voxelData.position.y + basePosition.y),
          Math.floor(voxelData.position.z + basePosition.z),
          1
        );

        this.add(mesh);
      }
    });
  }

  createTreeFromData(data, x, y, z) {
    data.forEach((item) => {
      const posX = x + item.position.x;
      const posY = y + item.position.y;
      const posZ = z + item.position.z;

      const materialProps = item.materialProps;
      const additionalData = item.additionalData;

    });
  }

  setTreeVoxel(x, y, z, type) {
    if (type === "autumn") {
      // Tronco
      this.setBlockType(x, y, z, "tree");
      this.setBlockType(x, y + 1, z, "tree");
      this.setBlockType(x, y + 2, z, "tree");

      // Foliagem
      this.setBlockType(x - 1, y + 3, z - 1, "tree");
      this.setBlockType(x + 1, y + 3, z + 1, "tree");
      this.setBlockType(x, y + 3, z, "tree");
    } else if (type === "oak") {
      // Tronco
      this.setBlockType(x, y, z, "tree");
      this.setBlockType(x, y + 1, z, "tree");
      this.setBlockType(x, y + 2, z, "tree");

      // Foliagem
      this.setBlockType(x, y + 3, z, "tree");
      this.setBlockType(x - 1, y + 3, z, "tree");
      this.setBlockType(x + 1, y + 3, z, "tree");
      this.setBlockType(x, y + 4, z, "tree");
    } else if (type === "default") {
      // Tronco
      this.setBlockType(x, y, z, "tree");
      this.setBlockType(x, y + 1, z, "tree");
      this.setBlockType(x, y + 2, z, "tree");

      // Foliagem
      this.setBlockType(x, y + 3, z, "tree");
      this.setBlockType(x - 1, y + 3, z, "tree");
      this.setBlockType(x + 1, y + 3, z, "tree");
      this.setBlockType(x, y + 4, z, "tree");
    }
  }

  autumnThree(x, y, z) {
    const trunkGeometry = new THREE.BoxGeometry(1, 3, 1);
    const trunkMaterial = new THREE.MeshLambertMaterial({
      map: this.wood1Texture,
    }); // Usando wood1
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);

    trunk.position.set(x, y + 1, z);

    const foliageGeometry = new THREE.BoxGeometry(3, 1, 3);
    const foliageMaterial = new THREE.MeshLambertMaterial({ color: "yellow" });
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);

    foliage.position.set(x, y + 3, z);

    const tree = new THREE.Group();
    tree.add(trunk);
    tree.add(foliage);

    return tree;
  }

  defaultThree(x, y, z) {
    const trunkMaterial = new THREE.MeshLambertMaterial({
      map: this.wood2Texture,
    }); // Usando wood2
    const foliageMaterial = new THREE.MeshLambertMaterial({ color: "green" });

    const trunk = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const trunkCube = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        trunkMaterial
      );
      trunkCube.position.set(x, y + i, z);
      trunk.add(trunkCube);
    }

    const foliage = new THREE.Group();
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const foliageCube = new THREE.Mesh(
          new THREE.BoxGeometry(1, 1, 1),
          foliageMaterial
        );
        foliageCube.position.set(x + i, y + 3, z + j);
        foliage.add(foliageCube);
      }
    }

    const foliageCube = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      foliageMaterial
    );
    foliageCube.position.set(x, y + 4, z);
    foliage.add(foliageCube);

    const tree = new THREE.Group();
    tree.add(trunk);
    tree.add(foliage);

    return tree;
  }

  oakThree(x, y, z) {
    const trunkGeometry = new THREE.BoxGeometry(1, 3, 1);
    const trunkMaterial = new THREE.MeshLambertMaterial({
      map: this.wood1Texture,
    }); // Usando wood1
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);

    trunk.position.set(x, y + 1, z);

    const foliageGeometry = new THREE.BoxGeometry(3, 1, 3);
    const foliageMaterial = new THREE.MeshLambertMaterial({ color: "red" });
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);

    foliage.position.set(x, y + 3, z);

    const tree = new THREE.Group();
    tree.add(trunk);
    tree.add(foliage);

    return tree;
  }
}