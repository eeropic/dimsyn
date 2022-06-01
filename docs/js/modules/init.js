var DS = {
    activeIDs: [],
    pianoKeys: [1,0,1,0,1,1,0,1,0,1,0,1],
    oscColors: {
        sine:[0.3,0,0.7],
        triangle:[0.1,0,0.9],
        square: [0.9,0,0.1],
        pwm: [0.9,0.9,0.1],
        sawtooth: [0.1,0.9,0.9],
        noise: [1,1,1]
    },
    yPixelScale: 20,
    noteOffset: 36,
    MAX_UNDOS: 10,
    playing: false,
    playPosition: 0,
    previousProjectState: null,
    currentProjectState: null,
    undoBuffer: [],
    undoPosition: -1
}

export { DS }