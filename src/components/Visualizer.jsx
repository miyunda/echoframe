import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { buildFrameState, createSceneRenderState, renderSceneFrame } from '../utils/sceneRenderer';
import { getScenePreset } from '../utils/scenePresets';

const Visualizer = forwardRef(({ audioRef, isPlaying, lyrics, avatar, background, audioName, scenePresetId }, ref) => {
    const canvasRef = useRef(null);
    const audioCtxRef = useRef(null);
    const leftAnalyserRef = useRef(null);
    const rightAnalyserRef = useRef(null);
    const animationRef = useRef(null);
    const avatarImgRef = useRef(null);
    const backgroundImgRef = useRef(null);
    const renderStateRef = useRef(createSceneRenderState());
    const presetRef = useRef(getScenePreset(scenePresetId));

    const syncCanvasSize = () => {
        const canvas = canvasRef.current;
        if (!canvas) return false;

        const bounds = canvas.getBoundingClientRect();
        const nextWidth = Math.round(bounds.width);
        const nextHeight = Math.round(bounds.height);

        if (nextWidth <= 0 || nextHeight <= 0) {
            return false;
        }

        if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
            canvas.width = nextWidth;
            canvas.height = nextHeight;
        }

        return true;
    };

    // Expose drawing config to parent if needed
    useImperativeHandle(ref, () => ({
        getCanvas: () => canvasRef.current,
        getContext: () => canvasRef.current?.getContext('2d'),
    }));

    useEffect(() => {
        presetRef.current = getScenePreset(scenePresetId);
        renderStateRef.current = createSceneRenderState();
        drawStillFrame();
    }, [scenePresetId]);

    useEffect(() => {
        if (avatar && avatar.url) {
            const img = new Image();
            img.src = avatar.url;
            img.onload = () => {
                avatarImgRef.current = img;
                drawStillFrame();
            };
        } else {
            avatarImgRef.current = null;
            drawStillFrame();
        }
    }, [avatar]);

    useEffect(() => {
        if (background?.type === 'image' && background.url) {
            const img = new Image();
            img.src = background.url;
            img.onload = () => {
                backgroundImgRef.current = img;
                drawStillFrame();
            };
        } else {
            backgroundImgRef.current = null;
            drawStillFrame();
        }
    }, [background]);

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
        else drawStillFrame();

        return () => {
            audioEl.removeEventListener('play', handlePlay);
            audioEl.removeEventListener('pause', handlePause);
            stopRendering();
        };
    }, [audioRef, isPlaying]);

    const drawFrame = (leftData, rightData) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        if (!syncCanvasSize()) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const frameState = buildFrameState({
            time: audioRef.current?.currentTime || 0,
            duration: audioRef.current?.duration || 0,
            leftData,
            rightData,
            lyrics,
        });

        renderSceneFrame({
            ctx,
            width,
            height,
            preset: presetRef.current,
            frameState,
            assets: {
                backgroundImage: backgroundImgRef.current,
                avatarImage: avatarImgRef.current,
                audioName,
            },
            renderState: renderStateRef.current,
        });
    };

    const drawStillFrame = () => {
        const bufferLength = leftAnalyserRef.current?.frequencyBinCount || 256;
        drawFrame(new Uint8Array(bufferLength), new Uint8Array(bufferLength));
    };

    const startRendering = () => {
        if (!canvasRef.current || !leftAnalyserRef.current || !rightAnalyserRef.current) return;
        if (animationRef.current) return;

        const canvas = canvasRef.current;
        const leftAnalyser = leftAnalyserRef.current;
        const rightAnalyser = rightAnalyserRef.current;

        const bufferLength = leftAnalyser.frequencyBinCount;
        const leftDataArray = new Uint8Array(bufferLength);
        const rightDataArray = new Uint8Array(bufferLength);

        if (renderStateRef.current.barsStateLeft.length !== bufferLength) {
            renderStateRef.current = createSceneRenderState(bufferLength);
        }

        const render = () => {
            animationRef.current = requestAnimationFrame(render);
            leftAnalyser.getByteFrequencyData(leftDataArray);
            rightAnalyser.getByteFrequencyData(rightDataArray);
            drawFrame(leftDataArray, rightDataArray);
        };

        render();
    };

    const stopRendering = () => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }
    };

    useEffect(() => {
        const handleResize = () => {
            if (!syncCanvasSize()) return;
            drawStillFrame();
        };

        requestAnimationFrame(handleResize);
        let observer = null;
        if (canvasRef.current?.parentElement && typeof ResizeObserver !== 'undefined') {
            observer = new ResizeObserver(handleResize);
            observer.observe(canvasRef.current.parentElement);
        }
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            observer?.disconnect();
        };
    }, []);

    useEffect(() => {
        if (!isPlaying) {
            drawStillFrame();
        }
    }, [isPlaying, lyrics, audioName, scenePresetId]);

    return (
        <canvas
            ref={canvasRef}
            className="w-full h-full"
        />
    );
});

export default Visualizer;
