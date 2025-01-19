import * as THREE from "three";
import { SimplexNoise } from 'simplexNoise';

export class World extends THREE.Group {

    data = [];

    params = {
        terrains: {
            scale: 30,
            magnitude: 0.2,
            offset: 0.2
        }
    };

    constructor(size = { width: 128, height: 20 }) {
        super();
        this.size = size;
        this.initTerrain();
    }

    setBlockId(x, y, z, instanceId) {
        if (this.inBounds(x, y, z)) {
            this.data[x][z][y].instanceId = instanceId;
        }
    }

    inBounds(x, y, z) {
        return (
            x >= 0 && x < this.size.width &&
            z >= 0 && z < this.size.width &&
            y >= 0 && y < this.size.height
        );
    }

    hasVoxel(x, y, z) {
        return this.data[x][y][z] ? true : false;
    }

    generate() {
        this.clear();
        this.generateTerrain();
        this.generateMesh();
    }

    initTerrain() {
        this.data = [];
        for (let x = -this.size.width/2; x < this.size.width/2; x++) {
            const slice = [];
            for (let z = -this.size.width/2; z < this.size.width/2; z++) {
                const row = [];
                for (let y = 0; y < this.size.height; y++) {
                    row.push({
                        id: 0,
                        instanceId: null
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
                const value = simplex.noise(x / this.params.terrains.scale, z / this.params.terrains.scale);
                const scaledNoise = this.params.terrains.offset + this.params.terrains.magnitude * value;
                let height = Math.floor(this.size.height * scaledNoise);
                height = Math.max(1, Math.min(height, this.size.height));

                for (let y = 0; y < height; y++) {
                    this.setBlockId(x, y, z, 1);
                }
            }
        }
    }

    generateMesh() {
        const maxCount = this.size.width * this.size.width * this.size.height;
        const voxelGeometry = new THREE.BoxGeometry(1, 1, 1);
        const voxelMaterial = new THREE.MeshLambertMaterial({ color: "forestgreen" });
    
        const mesh = new THREE.InstancedMesh(voxelGeometry, voxelMaterial, maxCount);
        mesh.count = 0;
    
        const matrix = new THREE.Matrix4();
    
        for (let x = 0; x < this.size.width; x++) {
            for (let z = 0; z < this.size.width; z++) {
                for (let y = 0; y < this.size.height; y++) {
                    if (this.data[x][z][y].instanceId !== null) {
                        matrix.setPosition(x + 0.5, y + 0.5, z + 0.5);
    
                        if (Math.random() < 0.0008) {
                            if (!this.hasVoxel(x, y + 1, z)) {
                                const tree = this.createVoxelTree(x + 0.5, y + 1, z + 0.5);
                                this.add(tree);
                            }
                        }
    
                        mesh.setMatrixAt(mesh.count++, matrix);
                    }
                }
            }
        }
    
        this.add(mesh);
    }
    
    createVoxelTree(x, y, z) {
        const trunkGeometry = new THREE.BoxGeometry(1, 3, 1);
        const trunkMaterial = new THREE.MeshLambertMaterial({ color: "brown" });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    
        trunk.position.set(x, y + 1, z);
    
        const foliageGeometry = new THREE.BoxGeometry(3, 1, 3);
        const foliageMaterial = new THREE.MeshLambertMaterial({ color: "green" });
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    
        foliage.position.set(x, y + 2, z);
    
        const tree = new THREE.Group();
        tree.add(trunk);
        tree.add(foliage);
    
        return tree;
    }
    
}
