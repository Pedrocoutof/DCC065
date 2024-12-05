const defaultBoxSize = {
    width: 1,
    height: 1,
    depth: 1,
};

const voxelTypes = [
    {
        color: '#966F33',
        name: 'wood',
        ...defaultBoxSize
    },
    {
        color: 'forestgreen',
        name: 'forestgreen',
        ...defaultBoxSize
    },
    {
        color: 'darkgreen',
        name: 'darkgreen',
        ...defaultBoxSize
    },
    {
        color: 'darkorange',
        name: 'orange',
        ...defaultBoxSize
    },
    {
        color: '#D8B589',
        name: 'oak',
        ...defaultBoxSize
    },
];

export default voxelTypes;
