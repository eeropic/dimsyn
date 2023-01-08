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
    PPQ: 40,
    pxPerSemitone: 10,
    BPM: 120,
    noteOffset: 0,
    MAX_UNDOS: 10,
    MAX_POLYPHONY: 15,
    undoBuffer: [],
    undoPosition: -1,
    playing: false,
    playPosition: 0,
    previousProjectState: null,
    currentProjectState: null,
    snapToSemiY: true,
    snapToGridX: true
}

export { DS }