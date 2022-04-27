class OscillatorProcessor extends AudioWorkletProcessor {
	normalizeFrequency = freq => 2 * Math.PI * freq / sampleRate
	rationalTanh= x => {
    if( x < -3 ) return -1;
    else if( x > 3 ) return 1;
    else return x * ( 27 + x * x ) / ( 27 + 9 * x * x );
	}
	exponentialBlend = (x, p, s) => {
			let c = 2 / (1 - s) - 1
			let y = 0;
			if (x < p)
					y = Math.pow(x,c) / Math.pow(p, c-1)
			else
					y = Math.pow(1-x, c) / Math.pow(1-p, c-1)
			return (x < p ? y : 1 - y)
	}

	prevTime = 0
	currTime = 0
	d = 0
	//isPlaying = true
	
	static get parameterDescriptors () {
			return [
				{ name: 'amp', automationRate: "k-rate",
					defaultValue: 0.0,
					minValue: 0.0, maxValue: 1.0 },		
				{ name: 'frequency', automationRate: "k-rate",
					defaultValue: 440,
					minValue: 0.00, maxValue: 0.5 * sampleRate},
			];
    }
		constructor (...args) {
			super(...args)
			this.port.onmessage = (e) => {
				if(e.data == "stop"){
					//this.isPlaying = false
				}
				if(e.data == "play"){
					//this.isPlaying = true
				}				
			}
		}
		process (inputs, outputs, parameters) {
			const output = outputs[0]
			
			const amps = parameters.amp
			const frequencies = parameters.frequency
			
			var t = 0;
			var dt = 0;
			var oscValue = 0
			var inp = 0;
			
			for (let i = 0; i < output[0].length; i++) {
				const amp = amps.length > 1 ? amps[i] : amps[0]
				const frequency = frequencies.length > 1 ? frequencies[i] : frequencies[0]
				
				this.prevTime = this.currTime
				this.currTime = currentTime + i / sampleRate
				dt = this.currTime - this.prevTime
				this.d += dt * frequency * 2 * Math.PI
				this.d = this.d % (2 * Math.PI)
				const cycle = this.d / (2 * Math.PI)

				output[0][i] = cycle * amp
//				output[1][i] = cycle * amp
			}
			return true
		}
}

registerProcessor("oscillator-processor", OscillatorProcessor);