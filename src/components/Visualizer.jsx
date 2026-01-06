import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { drawStereoBars, detectBass, drawLyrics } from '../utils/visualizerUtils';

const Visualizer = forwardRef(({ audioRef, isPlaying, onBassPulse, lyrics, avatar }, ref) => {
    const canvasRef = useRef(null);
    const audioCtxRef = useRef(null);
    const leftAnalyserRef = useRef(null);
    const rightAnalyserRef = useRef(null);
    const sourceRef = useRef(null);
    const animationRef = useRef(null);
    const barsLeftRef = useRef([]);
    const barsRightRef = useRef([]);
    const avatarImgRef = useRef(null);
    const avatarYOffsetRef = useRef(0);

    // Expose drawing config to parent if needed
    useImperativeHandle(ref, () => ({
        getCanvas: () => canvasRef.current,
        getContext: () => canvasRef.current?.getContext('2d'),
    }));

    useEffect(() => {
        if (avatar && avatar.url) {
            const img = new Image();
            img.src = avatar.url;
            img.onload = () => {
                avatarImgRef.current = img;
            };
        } else {
            avatarImgRef.current = null;
        }
    }, [avatar]);

    useEffect(() => {
        if (!audioRef.current) return;

        const initAudio = () => {
            if (audioCtxRef.current) return;

            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioContext();
            const leftAnalyser = ctx.createAnalyser();
            leftAnalyser.fftSize = 512;
            leftAnalyser.smoothingTimeConstant = 0.85;

            const rightAnalyser = ctx.createAnalyser();
            rightAnalyser.fftSize = 512;
            rightAnalyser.smoothingTimeConstant = 0.85;

            const splitter = ctx.createChannelSplitter(2);

            const source = ctx.createMediaElementSource(audioRef.current);

            // Connect source to splitter
            source.connect(splitter);

            // Connect split channels to analysers
            splitter.connect(leftAnalyser, 0, 0);
            splitter.connect(rightAnalyser, 1, 0);

            // Connect source to destination to hear audio
            source.connect(ctx.destination);

            audioCtxRef.current = ctx;
            leftAnalyserRef.current = leftAnalyser;
            rightAnalyserRef.current = rightAnalyser;
            sourceRef.current = source;
        };

        const handlePlay = () => {
            initAudio();
            if (audioCtxRef.current.state === 'suspended') {
                audioCtxRef.current.resume();
            }
            startRendering();
        };

        const handlePause = () => {
            stopRendering();
        };

        const audioEl = audioRef.current;
        audioEl.addEventListener('play', handlePlay);
        audioEl.addEventListener('pause', handlePause);

        if (isPlaying) handlePlay();

        return () => {
            audioEl.removeEventListener('play', handlePlay);
            audioEl.removeEventListener('pause', handlePause);
            stopRendering();
        };
    }, [audioRef]);

    const startRendering = () => {
        if (!canvasRef.current || !leftAnalyserRef.current || !rightAnalyserRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const leftAnalyser = leftAnalyserRef.current;
        const rightAnalyser = rightAnalyserRef.current;

        const bufferLength = leftAnalyser.frequencyBinCount;
        const leftDataArray = new Uint8Array(bufferLength);
        const rightDataArray = new Uint8Array(bufferLength);

        if (barsLeftRef.current.length === 0) {
            barsLeftRef.current = Array(bufferLength).fill(0);
            barsRightRef.current = Array(bufferLength).fill(0);
        }

        const render = () => {
            animationRef.current = requestAnimationFrame(render);
            leftAnalyser.getByteFrequencyData(leftDataArray);
            rightAnalyser.getByteFrequencyData(rightDataArray);

            const width = canvas.width;
            const height = canvas.height;
            ctx.clearRect(0, 0, width, height);

            // Bass detection (use Left channel or average?)
            // Let's use max of both to be responsive
            // Calculate Bass Energy (Average of first 5 bins)
            const bassBinCount = 5;
            let bassSum = 0;
            for (let i = 0; i < bassBinCount; i++) {
                // Use max of left/right for impact
                bassSum += Math.max(leftDataArray[i], rightDataArray[i]);
            }
            const bassAvg = bassSum / bassBinCount; // 0-255 Range

            // Map to Target Offset (Max 12% of height)
            // "Follow the rising" -> Direct mapping
            const targetOffset = - (bassAvg / 255) * (height * 0.12);

            // Smooth updates (Lerp) to prevent jitter, but keep it snappy
            const smoothing = 0.4;
            avatarYOffsetRef.current += (targetOffset - avatarYOffsetRef.current) * smoothing;

            if (detectBass(leftDataArray) || detectBass(rightDataArray)) {
                onBassPulse();
            }

            // Draw Avatar
            if (avatarImgRef.current) {
                const img = avatarImgRef.current;

                // Base size is 0.6 of min dimension
                const baseSize = Math.min(width, height) * 0.6;
                // Constant size
                const size = baseSize;

                const x = (width - size) / 2;
                // Add offset to Y
                const y = ((height - size) / 2) + avatarYOffsetRef.current;

                ctx.save();
                ctx.beginPath();
                ctx.arc(width / 2, y + size / 2, size / 2, 0, Math.PI * 2);
                ctx.clip();

                // Draw image to fill the circle
                // We want to crop center square
                const imgSize = Math.min(img.width, img.height);
                const sx = (img.width - imgSize) / 2;
                const sy = (img.height - imgSize) / 2;

                ctx.drawImage(img, sx, sy, imgSize, imgSize, x, y, size, size);

                // Optional: Add a border
                ctx.lineWidth = 4;
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.stroke();

                ctx.restore();
            }

            // Draw using stereo utility
            drawStereoBars(
                ctx,
                leftDataArray,
                rightDataArray,
                barsLeftRef.current,
                barsRightRef.current,
                width,
                height,
                { gravity: 1.8 }
            );

            // Draw Lyrics
            if (audioRef.current && lyrics) {
                drawLyrics(ctx, lyrics, audioRef.current.currentTime, width, height);
            }
        };

        render();
    };

    const stopRendering = () => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
    };

    useEffect(() => {
        const handleResize = () => {
            if (!canvasRef.current) return;
            const canvas = canvasRef.current;
            if (canvas.parentElement) {
                canvas.width = canvas.parentElement.clientWidth;
                canvas.height = canvas.parentElement.clientHeight;
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="w-full h-full"
        />
    );
});

export default Visualizer;
