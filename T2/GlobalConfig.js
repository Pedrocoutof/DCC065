let fogValue = 120;

const fogColor = 0x6EB1FF;

const gravity = -0.008;

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


export default { fogColor, movement, assetsPath, fogValue, gravity }