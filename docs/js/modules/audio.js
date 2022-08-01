import { DS } from './init.js';

function initAudioContext() {
    var AudioContext = window.AudioContext || window.webkitAudioContext;
    window.audioCtx = new AudioContext({ sampleRate: 48000 });
    var oscArray = []

    audioCtx.audioWorklet.addModule('js/oscillator-processor.js').then(() => {
        for (let i = 0; i < DS.MAX_POLYPHONY; i++) {
            let osc = new AudioWorkletNode(audioCtx, 'oscillator-processor', { outputChannelCount: [2] });
            osc.connect(audioCtx.destination)
            oscArray.push({
                id: null,
                osc,
                amp: osc.parameters.get('amp'),
                midpoint: osc.parameters.get('midpoint'),
                curvature: osc.parameters.get('curvature'),
                pan: osc.parameters.get('pan'),
                noise: osc.parameters.get('noise'),
                frequency: osc.parameters.get('frequency'),
                resonance: osc.parameters.get('resonance'),
            })
        }
    });

    return [audioCtx, oscArray]
}

function noteToFrequency(noteNumber) {
    return 440 * Math.pow(2, (noteNumber - 69) / 12);
}

function setOscillatorParams(params) {
    // new values for AudioParams
    const { osc, amp, pan, frequency, midpoint, curvature, noise, rampDuration, resonance, context } = params;

    // AudioParam references
    const { amp: _amp, pan: _pan, frequency: _frequency, midpoint: _midpoint, curvature: _curvature, noise: _noise,
        resonance: _resonance
    } = osc;

    _amp.setTargetAtTime(amp, context.currentTime, rampDuration)
    _frequency.linearRampToValueAtTime(frequency, context.currentTime + rampDuration)
    _midpoint.linearRampToValueAtTime(midpoint, context.currentTime + rampDuration)
    _curvature.linearRampToValueAtTime(curvature, context.currentTime + rampDuration)
    _pan.linearRampToValueAtTime(pan, context.currentTime + rampDuration)
    _noise.linearRampToValueAtTime(noise, context.currentTime + rampDuration)
    _resonance.linearRampToValueAtTime(resonance, context.currentTime + rampDuration)

}

function muteOscillators(oscArray) {
    oscArray.forEach(osc => {
        let amp = osc.amp
        amp.cancelScheduledValues(audioCtx.currentTime)
        amp.setTargetAtTime(0, audioCtx.currentTime, OSC_FADE_TIME)
        osc.id = null
    })
}

export { initAudioContext, noteToFrequency, setOscillatorParams, muteOscillators }