class OscillatorProcessor extends AudioWorkletProcessor {
	normalizeFrequency = freq => 2 * Math.PI * freq / sampleRate
	rationalTanh = x => {
    if( x < -3 ) return -1;
    else if( x > 3 ) return 1;
    else return x * ( 27 + x * x ) / ( 27 + 9 * x * x );
	}
	clamp = (x, min, max) => Math.max(min,Math.min(x,max))
	exponentialBlend = (x, p, s) => {
			let c = 2 / (1 - s) - 1
			let y = 0;
			if (x < p)
					y = Math.pow(x,c) / Math.pow(p, c-1)
			else
					y = Math.pow(1-x, c) / Math.pow(1-p, c-1)
			return (x < p ? y : 1 - y)
	}

	log = x => this.port.postMessage(x);

	prevTime = 0
	currTime = 0
	d = 0
	// Ladder filter
	b0 = 0
	b1 = 0
	b2 = 0
	b3 = 0
	b4 = 0
	
	static get parameterDescriptors () {
			return [
				{ name: 'amp',
					defaultValue: 0,
					minValue: 0.0, maxValue: 1.0 },				
				{ name: 'pan',
					defaultValue: 0.0,
					minValue: -1.0, maxValue: 1.0 },				
				{ name: 'frequency',
					defaultValue: 440,
					minValue: 1, maxValue: 0.5 * sampleRate},
				{ name: 'resonance',
					defaultValue: 0.9,
					minValue: 0.00, maxValue: 2.0 },				
				{ name: 'midpoint',
					defaultValue: 0.5,
					minValue: 0.05, maxValue: 0.5 },
				{ name: 'curvature',
					defaultValue: 0.5,
					minValue: 0.5, maxValue: 0.99 },
				{ name: 'noise',
					defaultValue: 0.0,
					minValue: 0.0, maxValue: 1.0 },
			];
    }
		constructor (...args) {
			super(...args)

		}
		process (inputs, outputs, parameters) {
			const output = outputs[0]
			
			const amps = parameters.amp
			const pans = parameters.pan
			const frequencies = parameters.frequency
			const resonances = parameters.resonance
			const midpoints = parameters.midpoint
			const curvatures = parameters.curvature
			const noises = parameters.noise;
			
			var q = 0;
			var p = 0;
			var f = 0;
			var t = 0;
			var dt = 0;
			var t1 = 0;
			var t2 = 0;
			var t3 = 0;
			var noiseValue = 0;
			var oscValue = 0
			var inp = 0;
			
			for (let i = 0; i < output[0].length; i++) {
				const amp = amps.length > 1 ? amps[i] : amps[0]
				const pan = pans.length > 1 ? pans[i] : pans[0]
				const frequency = frequencies.length > 1 ? frequencies[i] : frequencies[0]
				const frequencyN = this.normalizeFrequency(frequency/2);
				const resonance = resonances.length > 1 ? resonances[i] : resonances[0]
				const midpoint = midpoints.length > 1 ? midpoints[i] : midpoints[0]
				const curvature = curvatures.length > 1 ? curvatures[i] : curvatures[0]
				const noise = noises.length > 1 ? noises[i] : noises[0]
				
				this.prevTime = this.currTime
				this.currTime = currentTime + i / sampleRate
				dt = this.currTime - this.prevTime
				this.d += dt * frequency * 2 * Math.PI
				this.d = this.d % (2 * Math.PI)
				const cycle = this.d / (2 * Math.PI)
				
				const mult1 = 1 / midpoint;
        		const mult2 = 1 / (1 - midpoint);
				const midpoint2 = this.clamp(midpoint, 0.2, 0.5)
        		oscValue = cycle < midpoint
        		? this.exponentialBlend(cycle * mult1, midpoint2, curvature) * 2 - 1
        		: this.exponentialBlend(mult2 - cycle * mult2, midpoint2, curvature) * 2 - 1
				
				// crossfade between noise and oscillator
				oscValue *= (1-noise)
				noiseValue = (noise == 0)? 0 : noise * Math.random() * 2 - 1
				q = 1.0 - frequencyN
				p = frequencyN + 1.0 * frequencyN * q;
				f = p + p - 1.0;
				q = resonance * (1.0 + 0.5 * q * (1.0 - q + 5.6 * q * q));
				
				inp = (noiseValue) - q * this.b4;
				t1 = this.b1;  this.b1 = (inp + this.b0) * p - this.b1 * f;
				t2 = this.b2;  this.b2 = (this.b1 + t1) * p - this.b2 * f;
				t1 = this.b3;  this.b3 = (this.b2 + t2) * p - this.b3 * f;
				this.b4 = (this.b3 + t1) * p - this.b4 * f;
				this.b4 = this.b4 - this.b4 * this.b4 * this.b4 * 0.166667;
				this.b0 = inp;

				// equal power pan with square root
				const panLeft = Math.sqrt(0.5 * (1 - pan))
				const panRight = Math.sqrt(0.5 * (1 + pan))

/*
out_lp = b4
out_hp = in - b4;
out_bp = 3.0f * (b3 - b4);
*/				
				// (1-2*frequencyN)
				const bpOutput = (1-noise) * 3.0 * (this.b3 - this.b4) + this.clamp(noise/2,0,1) * inp
				output[0][i] = (oscValue + bpOutput) * panLeft * amp;
				output[1][i] = (oscValue + bpOutput) * panRight * amp;
			}
			return true
		}
}

registerProcessor("oscillator-processor", OscillatorProcessor);