import * as MP4Muxer from 'mp4-muxer';
import { buildFrameState, createSceneRenderState, renderSceneFrame } from './sceneRenderer';
import { createBackgroundTrack, resolveBackgroundFrame } from './backgroundTrack';

const MICROSECONDS_PER_SECOND = 1_000_000;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const createVideoConfig = (profile) => ({
    codec: profile.codec,
    width: profile.width,
    height: profile.height,
    bitrate: profile.videoBitrate,
    framerate: profile.fps,
    hardwareAcceleration: 'prefer-hardware',
    avc: { format: 'avc' },
});

const createAudioConfig = (audioBuffer, profile) => ({
    codec: 'mp4a.40.2',
    numberOfChannels: audioBuffer.numberOfChannels,
    sampleRate: audioBuffer.sampleRate,
    bitrate: profile.audioBitrate,
});

export async function canUseWebCodecsExport(profile, audioBuffer) {
    if (!profile?.webCodecs) return false;
    if (typeof VideoEncoder === 'undefined' || typeof VideoFrame === 'undefined') return false;
    if (typeof AudioEncoder === 'undefined' || typeof AudioData === 'undefined') return false;
    if (typeof OffscreenCanvas === 'undefined') return false;
    if (typeof VideoEncoder.isConfigSupported !== 'function') return false;
    if (typeof AudioEncoder.isConfigSupported !== 'function') return false;

    let videoSupport;
    let audioSupport;
    try {
        [videoSupport, audioSupport] = await Promise.all([
            VideoEncoder.isConfigSupported(createVideoConfig(profile)),
            AudioEncoder.isConfigSupported(createAudioConfig(audioBuffer, profile)),
        ]);
    } catch {
        return false;
    }

    return Boolean(videoSupport.supported && audioSupport.supported);
}

const encodeAudio = async ({ audioBuffer, profile, muxer }) => {
    let encoderError = null;
    const encoder = new AudioEncoder({
        output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
        error: (error) => {
            encoderError = error;
        },
    });

    encoder.configure(createAudioConfig(audioBuffer, profile));

    const channelData = Array.from({ length: audioBuffer.numberOfChannels }, (_, channel) =>
        audioBuffer.getChannelData(channel)
    );
    const chunkFrames = 2048;

    for (let offset = 0; offset < audioBuffer.length; offset += chunkFrames) {
        const frameCount = Math.min(chunkFrames, audioBuffer.length - offset);
        const planarData = new Float32Array(frameCount * audioBuffer.numberOfChannels);

        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel += 1) {
            planarData.set(channelData[channel].subarray(offset, offset + frameCount), channel * frameCount);
        }

        const audioData = new AudioData({
            format: 'f32-planar',
            sampleRate: audioBuffer.sampleRate,
            numberOfFrames: frameCount,
            numberOfChannels: audioBuffer.numberOfChannels,
            timestamp: Math.round((offset / audioBuffer.sampleRate) * MICROSECONDS_PER_SECOND),
            data: planarData,
        });

        encoder.encode(audioData);
        audioData.close();

        while (encoder.encodeQueueSize > 12) {
            if (encoderError) throw encoderError;
            await wait(5);
        }
    }

    await encoder.flush();
    if (encoderError) throw encoderError;
    encoder.close();
};

const loadExportAssets = async ({ background, avatar }) => {
    const backgroundImage = background?.type === 'image' && background.file
        ? await createImageBitmap(background.file)
        : null;
    const backgroundImages = background?.type === 'track'
        ? await Promise.all(background.items.map((item) => createImageBitmap(item.file)))
        : [];
    const avatarImage = avatar?.file ? await createImageBitmap(avatar.file) : null;

    return { backgroundImage, backgroundImages, avatarImage };
};

const closeBitmap = (bitmap) => {
    if (typeof bitmap?.close === 'function') bitmap.close();
};

export async function exportWithWebCodecs({
    profile,
    audio,
    audioBuffer,
    leftFrequencyDataSequence,
    rightFrequencyDataSequence,
    totalFrames,
    background,
    lyrics,
    avatar,
    preset,
    lyricLayoutMode,
    avatarMode,
    onProgress,
}) {
    const target = new MP4Muxer.ArrayBufferTarget();
    const muxer = new MP4Muxer.Muxer({
        target,
        video: {
            codec: 'avc',
            width: profile.width,
            height: profile.height,
            frameRate: profile.fps,
        },
        audio: {
            codec: 'aac',
            numberOfChannels: audioBuffer.numberOfChannels,
            sampleRate: audioBuffer.sampleRate,
        },
        fastStart: {
            expectedVideoChunks: totalFrames,
            expectedAudioChunks: Math.ceil(audioBuffer.length / 2048),
        },
    });

    let videoEncoderError = null;
    const videoEncoder = new VideoEncoder({
        output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
        error: (error) => {
            videoEncoderError = error;
        },
    });

    videoEncoder.configure(createVideoConfig(profile));

    const canvas = new OffscreenCanvas(profile.width, profile.height);
    const ctx = canvas.getContext('2d');
    const { backgroundImage, backgroundImages, avatarImage } = await loadExportAssets({ background, avatar });
    const backgroundTrack = background?.type === 'track'
        ? createBackgroundTrack(background.items, audioBuffer.duration, background.transition)
        : null;
    const renderState = createSceneRenderState(leftFrequencyDataSequence[0]?.length || 256);

    try {
        await encodeAudio({ audioBuffer, profile, muxer });

        for (let index = 0; index < totalFrames; index += 1) {
            const time = index / profile.fps;
            const leftData = leftFrequencyDataSequence[index] || leftFrequencyDataSequence[leftFrequencyDataSequence.length - 1];
            const rightData = rightFrequencyDataSequence[index] || rightFrequencyDataSequence[rightFrequencyDataSequence.length - 1];

            const frameState = buildFrameState({
                time,
                duration: audioBuffer.duration,
                leftData,
                rightData,
                lyrics,
                lyricLayoutMode,
                avatarMode,
            });

            renderSceneFrame({
                ctx,
                width: profile.width,
                height: profile.height,
                preset,
                frameState,
                assets: {
                    backgroundImage,
                    backgroundTrack,
                    backgroundImages,
                    backgroundFrame: backgroundTrack ? resolveBackgroundFrame(backgroundTrack, time) : null,
                    avatarImage,
                    audioName: audio.name,
                },
                renderState,
            });

            const frame = new VideoFrame(canvas, {
                timestamp: Math.round(time * MICROSECONDS_PER_SECOND),
                duration: Math.round((1 / profile.fps) * MICROSECONDS_PER_SECOND),
            });

            videoEncoder.encode(frame, { keyFrame: index % (profile.fps * 2) === 0 });
            frame.close();

            while (videoEncoder.encodeQueueSize > 10) {
                if (videoEncoderError) throw videoEncoderError;
                await wait(5);
            }

            if (index % Math.max(1, Math.floor(profile.fps / 2)) === 0) {
                onProgress?.(index / totalFrames);
                await wait(0);
            }
        }

        await videoEncoder.flush();
        if (videoEncoderError) throw videoEncoderError;
        videoEncoder.close();
        muxer.finalize();

        return new Blob([target.buffer], { type: 'video/mp4' });
    } finally {
        closeBitmap(backgroundImage);
        backgroundImages.forEach(closeBitmap);
        closeBitmap(avatarImage);
    }
}
