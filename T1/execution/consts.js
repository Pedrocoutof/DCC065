const ground = {
    width: 35, // eixo x
    depth: 35, // eixo z
    height: 3, // eixo y
}

const movement = {
    speed: 5,
    runningConst: 2.5
}

const assetsPath = {
    three: {
        path: "./assets/",
        filesName: [
            // "oak.json",
            // "default.json",
            "autumn.json"
        ]
    }
}


export default { ground, movement, assetsPath}