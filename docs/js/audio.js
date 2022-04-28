audioCtx = null
oscArray = []
globalTimer = null
globalTime = 0
activeIDs = []

function noteToFrequency(noteNumber) {
  return 440 * Math.pow(2, (noteNumber-69) / 12);
}

function initAudioContext(){
  var AudioContext = window.AudioContext || window.webkitAudioContext;
  window.audioCtx = new AudioContext({sampleRate: 48000});

  audioCtx.audioWorklet.addModule('js/oscillator-processor.js').then(() => {
    for(let i = 0; i < 15; i++){
        let osc = new AudioWorkletNode(audioCtx, 'oscillator-processor', {outputChannelCount: [2]});
        osc.connect(audioCtx.destination)
        oscArray.push({id:null, osc, lastUpdate: 0})
    }
  });

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
  } = getOscillatorParamRefs(osc.osc);
  //let rampDuration = 1/60;
  //_amp.cancelAndHoldAtTime(context.currentTime)
  //console.log(_amp.value)
  //console.log(amp)
  //setValueCurveAtTime(values, startTime, duration)

    //_amp.setValueCurveAtTime([_amp.value, amp], Math.max(osc.lastUpdate, context.currentTime), rampDuration)
  _amp.setTargetAtTime(amp,context.currentTime, rampDuration)
  //_amp.linearRampToValueAtTime(amp, Math.max(osc.lastUpdate,context.currentTime) + rampDuration)
  _frequency.linearRampToValueAtTime(frequency, context.currentTime + rampDuration)
  _midpoint.linearRampToValueAtTime(midpoint, context.currentTime + rampDuration)
  _curvature.linearRampToValueAtTime(curvature, context.currentTime + rampDuration)
  _pan.linearRampToValueAtTime(pan, context.currentTime + rampDuration)
  _noise.linearRampToValueAtTime(noise, context.currentTime + rampDuration)
  //_resonance.linearRampToValueAtTime(resonance, context.currentTime + rampDuration)    
}




