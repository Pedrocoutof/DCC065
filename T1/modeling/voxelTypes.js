const defaultBoxSize = {
    width: 1,
    height: 1,
    depth: 1,
};

const voxelTypes = [
    {
        color: 'brown',
        name: 'brown',
        ...defaultBoxSize
    },
    {
        color: 'forestgreen',
        name: 'forestgreen',
        ...defaultBoxSize
    },
    {
        color: 'yellow',
        name: 'yellow',
        ...defaultBoxSize
    },
    {
        color: 'purple',
        name: 'purple',
        ...defaultBoxSize
    },
    {
        color: 'black',
        name: 'black',
        ...defaultBoxSize
    },
];

export default voxelTypes;
