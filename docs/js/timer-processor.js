class TimerProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors () {
        return [{
            name: 'tempo',
            defaultValue: 120,
            minValue: 1,
            maxValue: 999,
            automationRate: "k-rate"
        }];
    }
    constructor (...args) {
        super(...args)
//      this.port.onmessage = (e) => {

//      }
    }
	
    process (inputs, outputs, parameters) {
        this.port.postMessage(currentTime);
        return true;
    }
}
registerProcessor("timer-processor", TimerProcessor);