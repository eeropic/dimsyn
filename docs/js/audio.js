const MAX_POLYPHONY = 15
audioCtx = null
oscArray = []
globalTimer = null
globalTime = 0
activeIDs = []

const pix2sec = (x) => x / (BPM / 60) / PPQ;

const qNote = timeInQnotes => timeInQnotes * PPQ
const noteToPx = midiNote => midiNote * GRID_Y
const pix2note = yCoord => yCoord / GRID_Y

// WebAudio related utility functions

function createNoiseBuffer(context) {
    let bufferSize = 2 * context.sampleRate;
    let noiseBuffer = context.createBuffer(1, bufferSize, context.sampleRate);
    let output = noiseBuffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
    return noiseBuffer;
}

function createNoiseOscillator(context) {
    let noiseOsc = context.createBufferSource();
    noiseOsc.buffer = createNoiseBuffer(context);
    noiseOsc.loop = true;
    return noiseOsc;
}

function noteToFrequency(noteNumber) {
    //return 440 * Math.pow(2, noteNumber / 12);
    return (noteNumber-MIDI_NOTE_440) * 100;
}

function createAudioNodeGroup(context, oscType = guiGlobals.osc, output){
    oscNode = createOscillator[oscType](context, oscType);
    gainNode = new GainNode(context, { gain: 0 });
    panNode = new StereoPannerNode(context, { pan: 0 });
    oscNode.connect(gainNode).connect(panNode).connect(output);
    return {
        oscNode,
        gainNode,
        panNode
    }
}

function createOscNodeGroup(context, output){
    let frequencyNode = new ConstantSourceNode(context, {offset: 440})
    let triangleNode = new OscillatorNode(context, {type: "triangle", frequency: 100})
    let squareNode = new OscillatorNode(context, {type: "square", frequency: 100})
    let sawtoothNode = new OscillatorNode(context, {type: "sawtooth", frequency: 100})
    let sineNode = new OscillatorNode(context, {type: "sine", frequency: 100})
    //let noiseNode = createNoiseOscillator(context)

    frequencyNode.connect(triangleNode.frequency)
    frequencyNode.connect(squareNode.frequency)
    frequencyNode.connect(sawtoothNode.frequency)
    frequencyNode.connect(sineNode.frequency)


    noiseGain = new GainNode(context, { gain: 0.1 });
    ampGain = new GainNode(context, { gain: 0 });

    let sineSquareMix = context.createChannelMerger(2);

    oscMix = new StereoPannerNode(context, { pan: 0 });
    panNode = new StereoPannerNode(context, { pan: 0 });

    sineNode.connect(sineSquareMix, 0, 0)
    squareNode.connect(sineSquareMix, 0, 1)

    sineSquareMix.connect(oscMix)
    oscMix.connect(ampGain)
    ampGain.connect(panNode).connect(output)

    frequencyNode.start()
    triangleNode.start()
    squareNode.start()
    sawtoothNode.start()
    sineNode.start()

    return {
        frequency: frequencyNode.offset,
        amp: ampGain.gain,
        curvature: oscMix.pan,
        pan: panNode.pan
    }
}

function createNoteEvent(context, oscType = guiGlobals.osc, noteNumber, segments, output){
    let audio = createAudioNodeGroup(context, guiGlobals.osc, masterOutput, output)
    audio.oscNode.start()
    audio.oscNode.detune.value = noteToFrequency(noteNumber);
    let path = createOscPath(audio, oscColor[guiGlobals.osc], noteNumber, segments)
    return {
        audio,
        path
    }
}

const createOsc = (context, type) => {
    return new OscillatorNode(context, { type, frequency: 440});
};

const createOscillator = {
    sine: (context, type) => createOsc(context, type),
    triangle: (context, type) => createOsc(context, type),
    square: (context, type) => createOsc(context, type),
    sawtooth: (context, type) => createOsc(context, type),
    noise: (context) => createNoiseOscillator(context),
};


function noteToFrequency(noteNumber) {
  return 440 * Math.pow(2, (noteNumber-69) / 12);
}


function initAudioContext(useAudioWorklet){
    var AudioContext = window.AudioContext || window.webkitAudioContext;
    window.audioCtx = new AudioContext({sampleRate: 48000});

    if(useAudioWorklet){
        audioCtx.audioWorklet.addModule('js/oscillator-processor.js').then(() => {

            //
            //reverbjs
            reverbjs.extend(audioCtx);

                var reverbUrl = '../assets/TerrysTypingRoom.m4a';
                var reverbNode = audioCtx.createReverbFromUrl(reverbUrl, function () {
                reverbNode.connect(audioCtx.destination);
                //    reverbNode.connect(masterOutput)

            });

            //

            for(let i = 0; i < MAX_POLYPHONY; i++){
                let osc = new AudioWorkletNode(audioCtx, 'oscillator-processor', {outputChannelCount: [2]});
                osc.port.onmessage = function(e){
                    if(e.timeStamp%100 == 0)console.log(e.data)
                }
                osc.connect(reverbNode)
                reverbNode.connect(audioCtx.destination)
                oscArray.push({
                    id:null, 
                    osc,
                    amp: osc.parameters.get('amp'), 
                    frequency: osc.parameters.get('frequency'),
                    midpoint: osc.parameters.get('midpoint'), 
                    curvature: osc.parameters.get('curvature'), 
                    pan: osc.parameters.get('pan'),
                    noise: osc.parameters.get('noise'),
                })
            }
        });
    }
    else {
        for(let i = 0; i < MAX_POLYPHONY; i++){
            let osc = createOscNodeGroup(audioCtx, audioCtx.destination)
            //let osc = new AudioWorkletNode(audioCtx, 'oscillator-processor', {outputChannelCount: [2]});
            //osc.connect(audioCtx.destination)
            osc.connect(reverbNode)
            oscArray.push({
                id:null, 
                osc,
                amp: osc.amp,
                frequency: osc.frequency,
                curvature: osc.curvature,
                pan: osc.pan
            })
        }        
    }
/*
TODO: Use audioworklet as a timer, to get higher tick rate. not working too good on older iOS devices atm
    let prevStamp = 0
    let currStamp = 0
    let prevData = 0
    let currData = 0

  audioCtx.audioWorklet.addModule('js/timer-processor.js').then(() => {
      globalTimer = new AudioWorkletNode(audioCtx, 'timer-processor');
      globalTimer.port.onmessage = function(e){
        //console.log(e.data.timestamp - parseFloat(e.data))

        prevStamp = currStamp
        prevData = currData
        currStamp = e.timeStamp / 1000
        currData = e.data
        console.log('stamp ' + (currStamp - prevStamp))
        console.log('data  ' + (currData - prevData))

        globalTime = e.data

//        view.update()
//        checkIntersections()

      }
    }); 
*/

  audioCtx.resume()
}

function getOscillatorParamRefs(osc){
  return {
    amp:osc.parameters.get('amp'), 
    frequency: osc.parameters.get('frequency'),
    midpoint: osc.parameters.get('midpoint'), 
    curvature: osc.parameters.get('curvature'), 
    pan: osc.parameters.get('pan'),
    noise: osc.parameters.get('noise'),
    //resonance: osc.parameters.get('resonance'),
  }  
}

function setOscillatorParams(params){
  const {osc, amp, pan, frequency, midpoint, curvature, noise, rampDuration,
  //  resonance, 
  context} = params;

  const {amp: _amp, pan: _pan, frequency: _frequency, midpoint: _midpoint, curvature: _curvature, noise: _noise, 
  // resonance: _resonance
  } = osc;

  //let rampDuration = 1/60;
  //_amp.cancelAndHoldAtTime(context.currentTime)
  //console.log(_amp.value)
  //console.log(amp)
  //setValueCurveAtTime(values, startTime, duration)

  _amp.setTargetAtTime(amp,context.currentTime, rampDuration)
  _frequency.linearRampToValueAtTime(frequency, context.currentTime + rampDuration)
  //_midpoint.linearRampToValueAtTime(midpoint, context.currentTime + rampDuration)
  _curvature.linearRampToValueAtTime(curvature, context.currentTime + rampDuration)
  _pan.linearRampToValueAtTime(pan, context.currentTime + rampDuration)

  /*

  _midpoint.linearRampToValueAtTime(midpoint, context.currentTime + rampDuration)
  _curvature.linearRampToValueAtTime(curvature, context.currentTime + rampDuration)
  
  _noise.linearRampToValueAtTime(noise, context.currentTime + rampDuration)

  */
  //_resonance.linearRampToValueAtTime(resonance, context.currentTime + rampDuration)    
}




