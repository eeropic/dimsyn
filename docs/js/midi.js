midiInputs = null
midiOutputs = null

midiOutputChannels = [...new Array(15)].fill({id: null})

console.log(midiOutputChannels)

MIDI_STATUS = {
    slide: [176, 74],
    pressure: 208,
    pitchbend: 224,
    noteon: 144,
    noteoff: 128
}

if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess().then(access => {
        console.log('WebMIDI enabled')
    
        for (var input of access.inputs.values()){
            input.onmidimessage = handleMidiInput;
        }
        midiOutputs = Array.from(access.outputs.values())
    }).catch(err => {
        console.log(err)
    })
}
else {
    console.log("Your browser doesn't support WebMIDI")
}

function handleMidiInput(message){
    //console.log(message.timeStamp)
    //console.log(performance.now())
    console.log(message.data)
}

// MPE
// Bx 4A yy = slide
// Dx zz    = channel pressure
// Ex yy zz = pitch bend yy LSB zz MSB
// 9x nn vv
// 8x nn vv
/*

&	AND	Sets each bit to 1 if both bits are 1
|	OR	Sets each bit to 1 if one of two bits is 1
^	XOR	Sets each bit to 1 if only one of two bits is 1
~	NOT	Inverts all the bits
<<	Zero fill left shift	Shifts left by pushing zeros in from the right and let the leftmost bits fall off
>>	Signed right shift	Shifts right by pushing copies of the leftmost bit in from the left, and let the rightmost bits fall off
>>>	Zero fill right shift	Shifts right by pushing zeros in from the left, and let the rightmost bits fall off

5 & 1	1	    0101 & 0001	    0001
5 | 1	5	    0101 | 0001	    0101
~ 5	    10	    ~0101	        1010
5 << 1	10	    0101 << 1	    1010
5 ^ 1	4	    0101 ^ 0001	    0100
5 >> 1	2	    0101 >> 1	    0010
5 >>> 1	2	    0101 >>> 1	    0010

*/