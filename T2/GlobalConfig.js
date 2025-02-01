const ground = {
    width: 35,
    depth: 35,
    height: 3,
}

let fogValue = 120;

const movement = {
    speed: 5,
    runningConst: 2.5
}

const assetsPath = {
    three: {
        filesName: [
            "oak.json",
            "default.json",
            "autumn.json"
        ]
    }
}


export default { ground, movement, assetsPath, fogValue}