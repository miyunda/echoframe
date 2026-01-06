/**
 * Extracts frequency data from an audio file offline at 60fps.
 * Uses OfflineAudioContext for fast, non-blocking analysis.
 */
export async function extractFrequencyData(audioBlob, fftSize = 512, onProgress) {
    console.log("Starting high-speed offline audio analysis...");
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext();
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    const duration = audioBuffer.duration;
    const sampleRate = audioBuffer.sampleRate;
    const fps = 60;
    const totalFrames = Math.ceil(duration * fps);
    const frameInterval = 1 / fps;

    const offlineCtx = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        sampleRate
    );

    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;

    const splitter = offlineCtx.createChannelSplitter(2);
    const leftAnalyser = offlineCtx.createAnalyser();
    leftAnalyser.fftSize = fftSize;
    leftAnalyser.smoothingTimeConstant = 0.85;

    const rightAnalyser = offlineCtx.createAnalyser();
    rightAnalyser.fftSize = fftSize;
    rightAnalyser.smoothingTimeConstant = 0.85;

    source.connect(splitter);
    splitter.connect(leftAnalyser, 0, 0);
    splitter.connect(rightAnalyser, 1, 0);

    // Connect to destination if we wanted render output, but for analysis we just need flow.
    // OfflineContext requires connection to destination to render? Yes usually.
    leftAnalyser.connect(offlineCtx.destination);
    rightAnalyser.connect(offlineCtx.destination);

    source.start(0);

    const leftFrequencyDataSequence = [];
    const rightFrequencyDataSequence = [];

    // Set up suspends for each frame to capture frequency data snapshots
    for (let i = 0; i < totalFrames; i++) {
        const time = i * frameInterval;
        if (time < duration) {
            offlineCtx.suspend(time).then(() => {
                const leftData = new Uint8Array(leftAnalyser.frequencyBinCount);
                const rightData = new Uint8Array(rightAnalyser.frequencyBinCount);

                leftAnalyser.getByteFrequencyData(leftData);
                rightAnalyser.getByteFrequencyData(rightData);

                leftFrequencyDataSequence.push(new Uint8Array(leftData));
                rightFrequencyDataSequence.push(new Uint8Array(rightData));

                // Report progress (this phase is 0-100% of the extraction)
                if (i % 30 === 0 && onProgress) {
                    onProgress(i / totalFrames);
                }

                offlineCtx.resume();
            });
        }
    }

    await offlineCtx.startRendering();
    console.log("Audio analysis complete. Captured frames:", leftFrequencyDataSequence.length);

    return { leftFrequencyDataSequence, rightFrequencyDataSequence, audioBuffer, duration, totalFrames };
}
