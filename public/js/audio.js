audioCtx = null
oscArray = []

function noteToFrequency(noteNumber) {
  return 440 * Math.pow(2, (noteNumber-69) / 12);
}

function initAudioContext(){
  var AudioContext = window.AudioContext || window.webkitAudioContext;
  window.audioCtx = new AudioContext();

  audioCtx.audioWorklet.addModule('js/oscillator-processor.js').then(() => {
    /*
    for(let i = 0; i < 20; i++){
        let osc = new AudioWorkletNode(audioCtx, 'oscillator-processor', {outputChannelCount: [2]});
        osc.connect(audioCtx.destination)
        oscArray.push({id:null, osc})
    }
    */
  });
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
    resonance: osc.parameters.get('resonance'),
  }  
}

function setOscillatorParams(params){
  const {osc, amp, pan, frequency, midpoint, curvature, noise, resonance, context} = params;
  const {amp: _amp, pan: _pan, frequency: _frequency, midpoint: _midpoint, curvature: _curvature, noise: _noise, resonance: _resonance} = getOscillatorParamRefs(osc);
  let rampDuration = 0.02;
  _amp.linearRampToValueAtTime(amp, context.currentTime + rampDuration)
  _frequency.linearRampToValueAtTime(frequency, context.currentTime + rampDuration)
  _midpoint.linearRampToValueAtTime(midpoint, context.currentTime + rampDuration)
  _curvature.linearRampToValueAtTime(curvature, context.currentTime + rampDuration)
  _pan.linearRampToValueAtTime(pan, context.currentTime + rampDuration)
  _noise.linearRampToValueAtTime(noise, context.currentTime + rampDuration)
  _resonance.linearRampToValueAtTime(resonance, context.currentTime + rampDuration)    
}

console.log('init audiddo')



