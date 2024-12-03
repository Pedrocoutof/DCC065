import * as THREE from 'three';

const v1 = {
    meshBasicMaterial: new THREE.MeshBasicMaterial({ color: 'brown' }),
    wireframe: new THREE.LineBasicMaterial({ color: 'brown' }),
    name: 'v1',
    type: 'box'
};

const v2 = {
    meshBasicMaterial: new THREE.MeshBasicMaterial({ color: 'forestgreen' }),
    wireframe: new THREE.LineBasicMaterial({ color: 'forestgreen' }),
    name: 'v2',
    type: 'box'
};

const v3 = {
    meshBasicMaterial: new THREE.MeshBasicMaterial({ color: 'yellow' }),
    wireframe: new THREE.LineBasicMaterial({ color: 'yellow' }),
    name: 'v3',
    type: 'box'
};

const v4 = {
    meshBasicMaterial: new THREE.MeshBasicMaterial({ color: 'purple' }),
    wireframe: new THREE.LineBasicMaterial({ color: 'purple' }),
    name: 'v4',
    type: 'box'
};

const v5 = {
    meshBasicMaterial: new THREE.MeshBasicMaterial({ color: 'black' }),
    wireframe: new THREE.LineBasicMaterial({ color: 'black' }),
    name: 'v5',
    type: 'box'
};

export const generateTrunk = (MAX_HEIGHT = 3) => {
    const geometry = new THREE.BoxGeometry(1, MAX_HEIGHT, 1);
    const material = new THREE.MeshBasicMaterial({ color: 'brown' })
    return new THREE.Mesh(geometry, material);
}

export function createWireframe(geometry, material) {
    const wireframe = new THREE.LineSegments(
        new THREE.EdgesGeometry(geometry),
        material
    );
    return wireframe;
}


const tree1 = {
    type: 'tree',
    create: function () {
        const group = new THREE.Group();
        const trunk = generateTrunk();
        trunk.position.y = 1;
        group.add(trunk);

        const foliage = new THREE.Mesh(
            new THREE.BoxGeometry(2, 2, 2),
            new THREE.MeshBasicMaterial({ color: 'green' })
        );
        foliage.position.y = 2;
        group.add(foliage);

        return group;
    },
    createWireframe: function () {
        const group = new THREE.Group();
        const trunkWireframe = createWireframe(
            new THREE.BoxGeometry(1, 3, 1),
            new THREE.LineBasicMaterial({ color: 'brown' })
        );
        trunkWireframe.position.y = 1;
        group.add(trunkWireframe);

        const foliageWireframe = createWireframe(
            new THREE.BoxGeometry(2, 2, 2),
            new THREE.LineBasicMaterial({ color: 'green' })
        );
        foliageWireframe.position.y = 2;
        group.add(foliageWireframe);

        return group;
    },
    name: 'tree1',
};

const tree2 = {
    type: 'tree',
    create: function () {
        const group = new THREE.Group();

        const trunk = generateTrunk();
        trunk.position.y = 1;
        group.add(trunk);

        const foliage = new THREE.Mesh(
            new THREE.ConeGeometry(1.5, 4, 6),
            new THREE.MeshBasicMaterial({ color: 'forestgreen' })
        );
        foliage.position.y = 3;
        group.add(foliage);

        return group;
    },
    createWireframe: function () {
        const group = new THREE.Group();

        const trunkWireframe = new THREE.LineSegments(
            new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 3, 1)),
            new THREE.LineBasicMaterial({ color: 'brown' })
        );
        trunkWireframe.position.y = 1;
        group.add(trunkWireframe);

        const foliageWireframe = new THREE.LineSegments(
            new THREE.EdgesGeometry(new THREE.ConeGeometry(1.5, 4, 6)),
            new THREE.LineBasicMaterial({ color: 'forestgreen' })
        );
        foliageWireframe.position.y = 3;
        group.add(foliageWireframe);

        return group;
    },
    name: 'tree2',
};

const tree3 = {
    type: 'tree',
    create: function () {
        const group = new THREE.Group();

        const trunk = generateTrunk();
        trunk.position.y = 1;
        group.add(trunk);

        const foliage1 = new THREE.Mesh(
            new THREE.SphereGeometry(1.5, 8, 8),
            new THREE.MeshBasicMaterial({ color: 'green' })
        );
        foliage1.position.y = 2;
        group.add(foliage1);

        const foliage2 = new THREE.Mesh(
            new THREE.SphereGeometry(1, 8, 8),
            new THREE.MeshBasicMaterial({ color: 'forestgreen' })
        );
        foliage2.position.y = 3.5;
        group.add(foliage2);

        return group;
    },
    createWireframe: function () {
        const group = new THREE.Group();

        const trunkWireframe = new THREE.LineSegments(
            new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 3, 1)),
            new THREE.LineBasicMaterial({ color: 'brown' })
        );
        trunkWireframe.position.y = 1;
        group.add(trunkWireframe);

        const foliage1Wireframe = new THREE.LineSegments(
            new THREE.EdgesGeometry(new THREE.SphereGeometry(1.5, 8, 8)),
            new THREE.LineBasicMaterial({ color: 'green' })
        );
        foliage1Wireframe.position.y = 2;
        group.add(foliage1Wireframe);

        const foliage2Wireframe = new THREE.LineSegments(
            new THREE.EdgesGeometry(new THREE.SphereGeometry(1, 8, 8)),
            new THREE.LineBasicMaterial({ color: 'forestgreen' })
        );
        foliage2Wireframe.position.y = 3.5;
        group.add(foliage2Wireframe);

        return group;
    },
    name: 'tree3',
};

const getVoxelByName = function (name) {
    for (let i = 0; i < voxelTypes.length; i++) {
        if (voxelTypes[i].name === name) {
            return voxelTypes[i];
        }
    }
};

export default [v1, v2, v3, v4, v5,tree1, tree2, tree3];
