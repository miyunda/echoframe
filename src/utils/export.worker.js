import * as MP4Muxer from 'mp4-muxer';
import { drawBars, detectBass } from './visualizerUtils';

self.onmessage = async (e) => {
    const {
        audioBufferData, // Array of Float32Arrays
        frequencyDataSequence,
        imageBitmap,
        width, height,
        sampleRate, numberOfChannels,
        totalFrames,
        audioName,
        selectedCodec
    } = e.data;

    try {
        // 1. Setup Muxer and Encoders
        const muxer = new MP4Muxer.Muxer({
            target: new MP4Muxer.ArrayBufferTarget(),
            video: {
                codec: selectedCodec.startsWith('avc') ? 'avc' : selectedCodec,
                width,
                height
            },
            audio: {
                codec: 'aac',
                sampleRate,
                numberOfChannels
            },
            fastStart: 'in-memory'
        });

        const videoEncoder = new VideoEncoder({
            output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
            error: (e) => self.postMessage({ type: 'error', error: 'VideoEncoder: ' + e.message })
        });
        videoEncoder.configure({
            codec: selectedCodec,
            width, height,
            bitrate: 5000000, // 720p cap
            framerate: 60
        });

        const audioEncoder = new AudioEncoder({
            output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
            error: (e) => self.postMessage({ type: 'error', error: 'AudioEncoder: ' + e.message })
        });
        audioEncoder.configure({
            codec: 'mp4a.40.2',
            numberOfChannels,
            sampleRate,
            bitrate: 128000
        });

        // 2. Encode Audio
        const bufferSize = 2048;
        const audioLength = audioBufferData[0].length;
        for (let i = 0; i < audioLength; i += bufferSize) {
            const currentBufferSize = Math.min(bufferSize, audioLength - i);
            const combinedData = new Float32Array(currentBufferSize * numberOfChannels);
            for (let ch = 0; ch < numberOfChannels; ch++) {
                combinedData.set(audioBufferData[ch].subarray(i, i + currentBufferSize), ch * currentBufferSize);
            }
            const audioData = new AudioData({
                format: 'f32-planar',
                sampleRate,
                numberOfFrames: currentBufferSize,
                numberOfChannels,
                timestamp: (i / sampleRate) * 1000000,
                data: combinedData
            });
            audioEncoder.encode(audioData);
            audioData.close();
        }
        await audioEncoder.flush();

        // 3. Render and Encode Video with Throttling
        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext('2d');
        const barsState = Array(256).fill(0);

        for (let i = 0; i < totalFrames; i++) {
            const data = frequencyDataSequence[i] || frequencyDataSequence[frequencyDataSequence.length - 1];
            ctx.clearRect(0, 0, width, height);

            const isBass = detectBass(data);
            const scale = isBass ? 1.05 : 1;

            ctx.save();
            ctx.translate(width / 2, height / 2);
            ctx.scale(scale, scale);
            ctx.drawImage(imageBitmap, -width / 2, -height / 2, width, height);
            ctx.restore();

            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.fillRect(0, 0, width, height);

            const vizWidth = width * 0.7;
            const vizHeight = height * 0.3;
            ctx.save();
            ctx.translate((width - vizWidth) / 2, height * 0.75);
            drawBars(ctx, data, barsState, vizWidth, vizHeight, { gravity: 3.0 });
            ctx.restore();

            ctx.fillStyle = 'white';
            ctx.font = 'bold 45px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(audioName, width / 2, height * 0.85 + 60);

            const frame = new VideoFrame(canvas, {
                timestamp: (i / 60) * 1000000
            });

            // Control backpressure: wait if too many frames are queued
            // VideoEncoder.encode is asynchronous in its execution but returns immediately.
            // We can use VideoEncoder.encodeQueueSize to throttle.
            while (videoEncoder.encodeQueueSize \u003e 10) {
                await new Promise(r =\u003e setTimeout(r, 10));
            }

            videoEncoder.encode(frame);
            frame.close();

            if (i % 30 === 0) {
                self.postMessage({ type: 'progress', progress: 30 + Math.floor((i / totalFrames) * 65) });
            }
        }

        await videoEncoder.flush();
        muxer.finalize();

        self.postMessage({ type: 'done', buffer: muxer.target.buffer }, [muxer.target.buffer]);
    } catch (err) {
        self.postMessage({ type: 'error', error: err.message });
    }
};
