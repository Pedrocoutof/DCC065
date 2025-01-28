import * as THREE from "three";
import { SimplexNoise } from "simplexNoise";
import {
    setDefaultMaterial
  } from "util";

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

  constructor(size = { width: 256, height: 20 }) {
    super();
    this.size = size;
    this.initTerrain();
  }

  setBlockId(x, y, z, instanceId) {
    if (this.inBounds(x, z, y)) {
      this.data[x][z][y].instanceId = instanceId;
    }
  }

  setBlockType(x, y, z, type) {
    if (this.inBounds(x, z, y)) {
      this.data[x][z][y].type = type;
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
          });
        }
        slice.push(row);
      }
      this.data.push(slice);
    }
  }

  generateTerrain() {
    const simplex = new SimplexNoise();

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
      }
    }
  }

  generateMeshVoxel(color) {
    const maxCount = this.size.width * this.size.width * this.size.height;
    const voxelGeometry = new THREE.BoxGeometry(1, 1, 1);
    const voxelMaterial = new THREE.MeshLambertMaterial({ color: color });
    
    voxelMaterial.receiveShadow = true;
    voxelMaterial.castShadow = true;
    voxelMaterial.fog = true;
    
    const mesh = new THREE.InstancedMesh(
      voxelGeometry,
      voxelMaterial,
      maxCount
    );
    return mesh;
  }

  generateMesh() {
    const grassMesh = this.generateMeshVoxel("forestgreen");
    grassMesh.count = 0;
    const dirtMesh = this.generateMeshVoxel(0x926c4d);
    dirtMesh.count = 0;
    const stoneMesh = this.generateMeshVoxel(0x808080);
    stoneMesh.count = 0;
    const sandMesh = this.generateMeshVoxel(0xc2b280);
    sandMesh.count = 0;

    const typesMeshes = {
      grass: grassMesh,
      dirt: dirtMesh,
      stone: stoneMesh,
      sand: sandMesh,
    };

    const matrix = new THREE.Matrix4();

    for (let x = 0; x < this.size.width; x++) {
      for (let z = 0; z < this.size.width; z++) {
        for (let y = 0; y < this.size.height; y++) {
          if (this.data[x][z][y].instanceId !== null) {
            matrix.setPosition(x + 0.5, y + 0.5, z + 0.5);

            const type = this.data[x][z][y].type;
            const mesh = typesMeshes[type];

            if (type === "grass" && Math.random() < 0.003) {
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

            if (mesh) {
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              mesh.setMatrixAt(mesh.count++, matrix);
            }
          }
        }
      }
    }

    this.add(grassMesh);
    this.add(dirtMesh);
    this.add(stoneMesh);
    this.add(sandMesh);
  }
  generateRandomThree(x, y, z) {
    let rand = Math.random();
    let basePosition = { x, y, z };

    // Definindo os voxels da árvore na matriz
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
        this.buildModeling(treeData, basePosition);  // Chama a função de modelagem após o carregamento
    } catch (error) {
        console.error("Erro ao carregar a árvore:", error);
    }
}

buildModeling(data, basePosition) {
    data.forEach((voxelData) => {
        // Criação da geometria do voxel
        const geometry = new THREE.BoxGeometry(
            voxelData.additionalData.width,
            voxelData.additionalData.height,
            voxelData.additionalData.depth
        );

        // Usando a função setDefaultMaterial para criar o material do voxel
        const voxelMaterial = setDefaultMaterial(
            voxelData.materialProps.color || 0xffffff  // Cor padrão: branco
        );

        // Criando o mesh do voxel
        const mesh = new THREE.Mesh(geometry, voxelMaterial);

        // Garantir que o mesh é um objeto válido e é do tipo correto
        if (mesh instanceof THREE.Mesh) {
            // Posicionando o mesh na cena
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
            1)

            // Garantir que a cena é válida
           // if (scene instanceof THREE.Scene) {
                this.add(mesh);  // Adiciona o mesh à cena
            //} else {
                //console.error("A cena não está inicializada corretamente.");
            //}
        //} else {
            //console.error("O objeto mesh não é uma instância de THREE.Mesh.");
        }
    });
}



  createTreeFromData(data, x, y, z) {
    // Iterando sobre os dados JSON e criando voxels para cada item
    data.forEach((item) => {
      const posX = x + item.position.x;
      const posY = y + item.position.y;
      const posZ = z + item.position.z;

      // Aplique as propriedades do material e dados adicionais
      const materialProps = item.materialProps;
      const additionalData = item.additionalData;

      // Exemplo de como você pode configurar os voxels com base nos dados
      this.setVoxel(posX, posY, posZ, materialProps.color, additionalData);
    });
  }

  setVoxel(x, y, z, color, additionalData) {
    // Função para definir o voxel no mundo com base nas propriedades
    console.log(
      `Definindo voxel em (${x}, ${y}, ${z}) com cor ${color} e dados adicionais:`,
      additionalData
    );
    // Aqui você deve integrar o código que realmente cria o voxel no mundo, com a cor e outras propriedades
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
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: "brown" });
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
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: "brown" });
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
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: "brown" });
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
