/*
    Generates a 6-second WAV file with specific channel patterns for 1080p export testing.
    Format: Stereo, 44.1kHz, 16-bit PCM
    
    Timeline:
    0-2s: Left Channel 440Hz (A4), Right Silence
    2-4s: Center 880Hz (A5), Equal L/R
    4-6s: Right Channel 440Hz (A4), Left Silence
*/

/* 
    Helper to write a string to a DataView
*/
function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

/* 
    Encodes AudioBuffer to WAV Blob
*/
function bufferToWave(abuffer, len) {
    var numOfChan = abuffer.numberOfChannels,
        length = len * numOfChan * 2 + 44,
        buffer = new ArrayBuffer(length),
        view = new DataView(buffer),
        channels = [],
        i, sample, offset = 0,
        pos = 0;

    // RIFF identifier
    writeString(view, pos, 'RIFF'); pos += 4;
    // file length
    view.setUint32(pos, length - 8, true); pos += 4;
    // RIFF type
    writeString(view, pos, 'WAVE'); pos += 4;
    // format chunk identifier
    writeString(view, pos, 'fmt '); pos += 4;
    // format chunk length
    view.setUint32(pos, 16, true); pos += 4;
    // sample format (raw)
    view.setUint16(pos, 1, true); pos += 2;
    // channel count
    view.setUint16(pos, numOfChan, true); pos += 2;
    // sample rate
    view.setUint32(pos, abuffer.sampleRate, true); pos += 4;
    // byte rate (sample rate * block align)
    view.setUint32(pos, abuffer.sampleRate * 2 * numOfChan, true); pos += 4;
    // block align (channel count * bytes per sample)
    view.setUint16(pos, numOfChan * 2, true); pos += 2;
    // bits per sample
    view.setUint16(pos, 16, true); pos += 2;
    // data chunk identifier
    writeString(view, pos, 'data'); pos += 4;
    // data chunk length
    view.setUint32(pos, length - pos - 4, true); pos += 4;

    // Write interleaved data
    for (i = 0; i < abuffer.numberOfChannels; i++)
        channels.push(abuffer.getChannelData(i));

    while (pos < length) {
        for (i = 0; i < numOfChan; i++) {
            // clamp output
            sample = Math.max(-1, Math.min(1, channels[i][offset]));
            // scale to 16-bit signed int
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
            view.setInt16(pos, sample, true);
            pos += 2;
        }
        offset++;
    }

    return new Blob([buffer], { type: "audio/wav" });
}

export async function generateDebugAudioBlob() {
    const SAMPLE_RATE = 44100;
    const DURATION = 6;
    const ctx = new OfflineAudioContext(2, SAMPLE_RATE * DURATION, SAMPLE_RATE);

    const t = ctx.currentTime;

    // 1. Left Channel Only: 0-2s, 440Hz
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 440;
    const gain1 = ctx.createGain();
    gain1.gain.setValueAtTime(0, 0);
    gain1.gain.linearRampToValueAtTime(0.5, 0.1);
    gain1.gain.setValueAtTime(0.5, 1.9);
    gain1.gain.linearRampToValueAtTime(0, 2.0);

    // Splitter/Merger for routing
    const merger1 = ctx.createChannelMerger(2);
    osc1.connect(gain1);
    gain1.connect(merger1, 0, 0); // Connect to Left input of merger
    // gain1.connect(merger1, 0, 1); // DO NOT connect to Right
    merger1.connect(ctx.destination);

    osc1.start(0);
    osc1.stop(2);


    // 2. Center (Both Channels): 2-4s, 880Hz
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 880;
    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0, 2.0);
    gain2.gain.linearRampToValueAtTime(0.5, 2.1);
    gain2.gain.setValueAtTime(0.5, 3.9);
    gain2.gain.linearRampToValueAtTime(0, 4.0);

    osc2.connect(gain2);
    gain2.connect(ctx.destination); // Simple connection goes to both by default for mono source

    osc2.start(2);
    osc2.stop(4);


    // 3. Right Channel Only: 4-6s, 440Hz
    const osc3 = ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.value = 440;
    const gain3 = ctx.createGain();
    gain3.gain.setValueAtTime(0, 4.0);
    gain3.gain.linearRampToValueAtTime(0.5, 4.1);
    gain3.gain.setValueAtTime(0.5, 5.9);
    gain3.gain.linearRampToValueAtTime(0, 6.0);

    const merger3 = ctx.createChannelMerger(2);
    osc3.connect(gain3);
    // gain3.connect(merger3, 0, 0); // DO NOT connect to Left
    gain3.connect(merger3, 0, 1); // Connect to Right input of merger
    merger3.connect(ctx.destination);

    osc3.start(4);
    osc3.stop(6);

    const renderedBuffer = await ctx.startRendering();
    return bufferToWave(renderedBuffer, renderedBuffer.length);
}
