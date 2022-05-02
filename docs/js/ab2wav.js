// adapted from github.com/Jam3/audiobuffer-to-wav ( which is adapted from github.com/mattdiamond/recorderjs export feature )
const AB2WAV = {
    toWav(buffer, opt) {
        opt = opt || {};
        var format = opt.float32 ? 3 : 1;
        var bitDepth = format === 3 ? 32 : 16;
        var result =
            buffer.numberOfChannels === 2
                ? this.interleave(buffer.getChannelData(0), buffer.getChannelData(1))
                : buffer.getChannelData(0);
        return this.encodeWAV(result, format, buffer.sampleRate, buffer.numberOfChannels, bitDepth);
    },
    encodeWAV(samples, format, sampleRate, numChannels, bitDepth) {
        var bytesPerSample = bitDepth / 8;
        var blockAlign = numChannels * bytesPerSample;
        var buffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
        var view = new DataView(buffer);
        this.writeString(view, 0, 'RIFF'); // RIFF identifier
        view.setUint32(4, 36 + samples.length * bytesPerSample, true); // RIFF chunk length
        this.writeString(view, 8, 'WAVE'); // RIFF type
        this.writeString(view, 12, 'fmt '); // format chunk identifier
        view.setUint32(16, 16, true); // format chunk length
        view.setUint16(20, format, true); // sample format (raw)
        view.setUint16(22, numChannels, true); // channel count
        view.setUint32(24, sampleRate, true); // sample rate
        view.setUint32(28, sampleRate * blockAlign, true); // byte rate (sample rate * block align)
        view.setUint16(32, blockAlign, true); // block align (channel count*bytes per sample)
        view.setUint16(34, bitDepth, true); // bits per sample
        this.writeString(view, 36, 'data'); // data chunk identifier
        view.setUint32(40, samples.length * bytesPerSample, true); // data chunk length
        if (format === 1) this.floatTo16BitPCM(view, 44, samples);
        // Raw PCM
        else this.writeFloat32(view, 44, samples);
        return buffer;
    },
    interleave(inputL, inputR) {
        var length = inputL.length + inputR.length;
        var result = new Float32Array(length);
        var index = 0;
        var inputIndex = 0;
        while (index < length) {
            result[index++] = inputL[inputIndex];
            result[index++] = inputR[inputIndex];
            inputIndex++;
        }
        return result;
    },
    writeFloat32(output, offset, input) {
        for (var i = 0; i < input.length; i++, offset += 4) output.setFloat32(offset, input[i], true);
    },
    floatTo16BitPCM(output, offset, input) {
        for (var i = 0; i < input.length; i++, offset += 2) {
            var s = Math.max(-1, Math.min(1, input[i]));
            output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        }
    },
    writeString(view, offset, string) {
        for (var i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
    },
};
