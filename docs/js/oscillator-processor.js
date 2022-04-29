class OscillatorProcessor extends AudioWorkletProcessor {
	normalizeFrequency = freq => 2 * Math.PI * freq / sampleRate
	rationalTanh = x => {
    if( x < -3 ) return -1;
    else if( x > 3 ) return 1;
    else return x * ( 27 + x * x ) / ( 27 + 9 * x * x );
	}
	clamp = (x, min, max) => Math.max(min,Math.min(x,max))

	// Exponential blend function from https://math.stackexchange.com/a/1754900
	// https://www.desmos.com/calculator/hnna88e40o
	
	exponentialBlend = (x, p, s) => {
			let c = 2 / (1 - s) - 1
			let y = 0;
			if (x < p)
					y = Math.pow(x,c) / Math.pow(p, c-1)
			else
					y = Math.pow(1-x, c) / Math.pow(1-p, c-1)
			return (x < p ? y : 1 - y)
	}

	resetPhase = () => {
		this.d = Math.PI / 2
	}

	log = x => this.port.postMessage(x);

	prevTime = 0
	currTime = 0
	d = Math.PI / 2
	// Ladder filter
	
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
				{ name: 'midpoint',
					defaultValue: 0.99,
					minValue: 0.01, maxValue: 0.99 },
				{ name: 'curvature',
					defaultValue: 0.01,
					minValue: 0.01, maxValue: 0.99 },
				{ name: 'noise',
					defaultValue: 0.0,
					minValue: 0.0, maxValue: 1.0 },
			];
    }
		constructor (...args) {
			super(...args)
			this.port.onmessage = (e) => {
				if(e.data == "reset"){
					this.resetPhase()
				}
			}
		}
		process (inputs, outputs, parameters) {
			const output = outputs[0]
			const amps = parameters.amp
			const pans = parameters.pan
			const frequencies = parameters.frequency
			const midpoints = parameters.midpoint
			const curvatures = parameters.curvature
			const noises = parameters.noise;
			
			var q = 0;
			var p = 0;
			var f = 0;
			var t = 0;
			var dt = 0;
			var noiseValue = 0;
			var oscValue = 0
			var inp = 0;

			//if(currentTime%1 == 0)
				//console.log(amps[0])
			
			for (let i = 0; i < output[0].length; i++) {
				const amp = amps.length > 1 ? amps[i] : amps[0]
				const pan = pans.length > 1 ? pans[i] : pans[0]
				const frequency = frequencies.length > 1 ? frequencies[i] : frequencies[0]
				let midpoint = midpoints.length > 1 ? midpoints[i] : midpoints[0]
				let curvature = curvatures.length > 1 ? curvatures[i] : curvatures[0]
				const noise = noises.length > 1 ? noises[i] : noises[0]
				
				this.prevTime = this.currTime
				this.currTime = currentTime + i / sampleRate
				dt = this.currTime - this.prevTime
				this.d += dt * frequency * 2 * Math.PI
				this.d = this.d % (2 * Math.PI)
				const cycle = this.d / (2 * Math.PI)
				midpoint = midpoint / 2.0;
				curvature = curvature / 2.0 + 0.5;
				//this.log(curvature)
				const mult1 = 1 / midpoint;
        		const mult2 = 1 / (1 - midpoint);
				const midpoint2 = this.clamp(midpoint, 0.2, 0.5)
        		oscValue = cycle < midpoint
        		? this.exponentialBlend(cycle * mult1, midpoint2, curvature) * 2 - 1
        		: this.exponentialBlend(mult2 - cycle * mult2, midpoint2, curvature) * 2 - 1
				
				// crossfade between noise and oscillator
				//oscValue *= (1-noise)
				noiseValue = (noise == 0)? 0 : noise * Math.random() * 2 - 1
				
				// equal power pan with square root
				const panLeft = Math.sqrt(0.5 * (1 - pan))
				const panRight = Math.sqrt(0.5 * (1 + pan))

/*
out_lp = b4
out_hp = in - b4;
out_bp = 3.0f * (b3 - b4);
*/				
				output[0][i] = oscValue * amp;
				output[1][i] = oscValue * amp;

				//output[0][i] = (oscValue + noiseValue) * panLeft * amp;
				//output[1][i] = (oscValue + noiseValue) * panRight * amp;
			}
			return true
		}
}

registerProcessor("oscillator-processor", OscillatorProcessor);