import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { drawStereoBars, detectBass, drawLyrics } from '../utils/visualizerUtils';

const Visualizer = forwardRef(({ audioRef, isPlaying, onBassPulse, lyrics }, ref) => {
    const canvasRef = useRef(null);
    const audioCtxRef = useRef(null);
    const leftAnalyserRef = useRef(null);
    const rightAnalyserRef = useRef(null);
    const sourceRef = useRef(null);
    const animationRef = useRef(null);
    const barsLeftRef = useRef([]);
    const barsRightRef = useRef([]);

    // Expose drawing config to parent if needed
    useImperativeHandle(ref, () => ({
        getCanvas: () => canvasRef.current,
        getContext: () => canvasRef.current?.getContext('2d'),
    }));

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
            if (detectBass(leftDataArray) || detectBass(rightDataArray)) {
                onBassPulse();
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
