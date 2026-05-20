import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, X, Download, CheckCircle2, Zap } from 'lucide-react';
import Visualizer from './Visualizer';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { extractFrequencyData } from '../utils/offlineProcessor';
import { buildFrameState, createSceneRenderState, renderSceneFrame } from '../utils/sceneRenderer';
import { getScenePreset } from '../utils/scenePresets';
import { createBackgroundTrack, resolveBackgroundFrame } from '../utils/backgroundTrack';
import { DEFAULT_EXPORT_PROFILE_ID, EXPORT_PROFILES, getExportProfile } from '../utils/exportProfiles';
import { canUseWebCodecsExport, exportWithWebCodecs } from '../utils/webcodecsExport';

const EXPORT_STAGES = {
    IDLE: 'idle',
    INITIALIZING: '正在初始化引擎...',
    ANALYZING: '预分析音频数据...',
    RENDERING: '分帧渲染影像中...',
    ENCODING: '合并视音频压制中...',
    READY: 'ready'
};

const muxVideoWithAudio = async (ffmpeg, { videoBlob, audioFile }) => {
    const videoData = new Uint8Array(await videoBlob.arrayBuffer());
    const audioData = await fetchFile(audioFile);

    await ffmpeg.writeFile('video.mp4', videoData);
    await ffmpeg.writeFile('audio.mp3', audioData);

    try {
        await ffmpeg.exec([
            '-i', 'video.mp4',
            '-i', 'audio.mp3',
            '-c:v', 'copy',
            '-c:a', 'aac',
            '-shortest',
            'output.mp4'
        ]);

        const data = await ffmpeg.readFile('output.mp4');
        return new Blob([data], { type: 'video/mp4' });
    } finally {
        for (const fileName of ['video.mp4', 'audio.mp3', 'output.mp4']) {
            try {
                await ffmpeg.deleteFile(fileName);
            } catch {
                // Ignore cleanup failures.
            }
        }
    }
};

const createExportCanvas = (width, height) => {
    if (typeof OffscreenCanvas !== 'undefined') {
        const canvas = new OffscreenCanvas(width, height);
        return {
            canvas,
            ctx: canvas.getContext('2d'),
            toBlob: (options) => canvas.convertToBlob(options),
        };
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return {
        canvas,
        ctx: canvas.getContext('2d'),
        toBlob: ({ type, quality }) => new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) resolve(blob);
                else reject(new Error('Canvas frame conversion failed.'));
            }, type, quality);
        }),
    };
};

export default function Preview({ background, audio, audioRef, isPlaying, setIsPlaying, onClear, lyrics, avatar, scenePresetId, lyricLayoutMode, avatarMode }) {
    const [exportStage, setExportStage] = useState(EXPORT_STAGES.IDLE);
    const [exportProgress, setExportProgress] = useState(0);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [selectedExportProfileId, setSelectedExportProfileId] = useState(DEFAULT_EXPORT_PROFILE_ID);
    const ffmpegRef = useRef(new FFmpeg());

    useEffect(() => {
        return () => {
            if (downloadUrl) URL.revokeObjectURL(downloadUrl);
        };
    }, [downloadUrl]);

    const loadFFmpeg = async () => {
        const ffmpeg = ffmpegRef.current;
        if (ffmpeg.loaded) return;

        // Load ffmpeg.wasm from CDN or locally if configured
        const baseURL = 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm';
        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
        });
    };

    const handleExport = async () => {
        if (exportStage !== EXPORT_STAGES.IDLE || !audio.file) return;

        try {
            const selectedProfile = getExportProfile(selectedExportProfileId);
            console.log("Export started", selectedProfile);
            setExportProgress(0);

            // 1. Initialize Engine
            setIsPlaying(false); // Stop playback before export
            setExportStage(EXPORT_STAGES.INITIALIZING);

            // 2. Audio Analysis
            setExportStage(EXPORT_STAGES.ANALYZING);
            const { leftFrequencyDataSequence, rightFrequencyDataSequence, duration, totalFrames } = await extractFrequencyData(
                audio.file,
                512,
                (p) => setExportProgress(Math.floor(p * 10)), // 0-10%
                { fps: selectedProfile.fps }
            );
            const preset = getScenePreset(scenePresetId);

            if (await canUseWebCodecsExport(selectedProfile)) {
                setExportStage(EXPORT_STAGES.ENCODING);
                setExportProgress(12);

                const silentVideoBlob = await exportWithWebCodecs({
                    profile: selectedProfile,
                    audio,
                    duration,
                    leftFrequencyDataSequence,
                    rightFrequencyDataSequence,
                    totalFrames,
                    background,
                    lyrics,
                    avatar,
                    preset,
                    lyricLayoutMode,
                    avatarMode,
                    onProgress: (progress) => setExportProgress(12 + Math.floor(progress * 83)),
                });

                await loadFFmpeg();
                const ffmpeg = ffmpegRef.current;
                setExportProgress(96);
                const blob = await muxVideoWithAudio(ffmpeg, {
                    videoBlob: silentVideoBlob,
                    audioFile: audio.file,
                });

                setDownloadUrl(URL.createObjectURL(blob));
                setExportProgress(100);
                setExportStage(EXPORT_STAGES.READY);
                return;
            }

            await loadFFmpeg();
            const ffmpeg = ffmpegRef.current;

            ffmpeg.on('log', ({ message }) => {
                console.log("FFmpeg log:", message);
                const match = message.match(/frame=\s*(\d+)/);
                if (match) {
                    const encodedFrames = parseInt(match[1]);
                    // Map encoding progress (0-100%) to export progress (70-95%)
                    const encodingPercent = encodedFrames / totalFrames;
                    setExportProgress(70 + Math.floor(encodingPercent * 25)); // 70-95%
                }
            });

            // 3. Rendering Phase
            setExportStage(EXPORT_STAGES.RENDERING);
            const FPS = selectedProfile.fps;
            const width = selectedProfile.width;
            const height = selectedProfile.height;
            const { ctx, toBlob } = createExportCanvas(width, height);
            const bgImage = background?.type === 'image' && background.file
                ? await createImageBitmap(background.file)
                : null;
            const backgroundTrack = background?.type === 'track'
                ? createBackgroundTrack(background.items, duration, background.transition)
                : null;
            const backgroundImages = background?.type === 'track'
                ? await Promise.all(background.items.map((item) => createImageBitmap(item.file)))
                : [];
            // Load Avatar Bitmap if exists
            let avatarImage = null;
            if (avatar && avatar.file) {
                avatarImage = await createImageBitmap(avatar.file);
            }

            const renderState = createSceneRenderState(leftFrequencyDataSequence[0]?.length || 256);

            for (let i = 0; i < totalFrames; i++) {
                // Calculate precise virtual time for this frame
                const virtualTime = i / FPS;

                const leftData = leftFrequencyDataSequence[i] || leftFrequencyDataSequence[leftFrequencyDataSequence.length - 1];
                const rightData = rightFrequencyDataSequence[i] || rightFrequencyDataSequence[rightFrequencyDataSequence.length - 1];
                const frameState = buildFrameState({
                    time: virtualTime,
                    duration,
                    leftData,
                    rightData,
                    lyrics,
                    lyricLayoutMode,
                    avatarMode,
                });

                renderSceneFrame({
                    ctx,
                    width,
                    height,
                    preset,
                    frameState,
                    assets: {
                        backgroundImage: bgImage,
                        backgroundTrack,
                        backgroundImages,
                        backgroundFrame: backgroundTrack ? resolveBackgroundFrame(backgroundTrack, virtualTime) : null,
                        avatarImage,
                        audioName: audio.name,
                    },
                    renderState,
                });

                // Convert to PNG blob and write to memory FS
                const blob = await toBlob({ type: 'image/jpeg', quality: 0.9 });
                let frameData = new Uint8Array(await blob.arrayBuffer());
                const frameName = `frame_${i.toString().padStart(6, '0')}.jpg`;

                // Explicit write
                await ffmpeg.writeFile(frameName, frameData);

                // Explicit memory release
                frameData = null;

                // Memory protection & UI interactivity
                if (i % 50 === 0) { // More frequent updates
                    await new Promise(r => setTimeout(r, 0));
                    setExportProgress(10 + Math.floor((i / totalFrames) * 60)); // 10-70%
                }
            }

            // 4. Encoding Phase (Step 1: Video Generation)
            setExportStage(EXPORT_STAGES.ENCODING);
            setExportProgress(70);

            // Generate silent video first
            await ffmpeg.exec([
                '-framerate', `${FPS}`, // Use constant FPS
                '-i', 'frame_%06d.jpg',
                '-c:v', 'libx264',
                '-preset', 'ultrafast',
                '-pix_fmt', 'yuv420p',
                '-b:v', `${Math.round(selectedProfile.videoBitrate / 1000)}k`,
                // '-an', // No audio
                'video.mp4'
            ]);

            // 5. Muxing Phase (Step 2: Merge Audio)
            setExportProgress(95);
            // setExportStage("Finalizing Mux...");

            const blob = await muxVideoWithAudio(ffmpeg, {
                videoBlob: new Blob([await ffmpeg.readFile('video.mp4')], { type: 'video/mp4' }),
                audioFile: audio.file,
            });
            setDownloadUrl(URL.createObjectURL(blob));

            // Cleanup FS
            for (let i = 0; i < totalFrames; i++) {
                try {
                    await ffmpeg.deleteFile(`frame_${i.toString().padStart(6, '0')}.jpg`);
                } catch (e) { /* ignore missing delete */ }
            }

            setExportProgress(100);
            setExportStage(EXPORT_STAGES.READY);

        } catch (err) {
            console.error("FFmpeg Export Error:", err);
            setExportStage(EXPORT_STAGES.IDLE);
            alert("导出失败: " + err.message);
        }
    };

    const handleDownload = () => {
        if (!downloadUrl) return;
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `EchoFrame_HD_${Date.now()}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => setExportStage(EXPORT_STAGES.IDLE), 1000);
    };

    const isSynthesizing = exportStage !== EXPORT_STAGES.IDLE && exportStage !== EXPORT_STAGES.READY;

    return (
        <div className="w-full flex flex-col gap-6">
            <div className="w-full relative aspect-video sm:aspect-[21/9] rounded-2xl overflow-hidden glass group animate-in fade-in zoom-in duration-500 shadow-[0_28px_80px_rgba(87,82,121,0.24)]">
                <div className="absolute inset-0">
                    <Visualizer
                        audioRef={audioRef}
                        isPlaying={isPlaying}
                        lyrics={lyrics}
                        avatar={avatar}
                        background={background}
                        audioName={audio.name}
                        scenePresetId={scenePresetId}
                        lyricLayoutMode={lyricLayoutMode}
                        avatarMode={avatarMode}
                    />
                </div>

                {exportStage === EXPORT_STAGES.IDLE && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-text/14">
                        <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="p-6 rounded-full border border-white/40 bg-surface/35 backdrop-blur-md transition-all transform hover:scale-110 hover:bg-surface/55 active:scale-95"
                        >
                            {isPlaying ? <Pause className="text-text fill-text" /> : <Play className="text-text fill-text ml-1" />}
                        </button>
                    </div>
                )}

                {isSynthesizing && (
                    <div className="absolute inset-0 bg-base/95 backdrop-blur-xl flex items-center justify-center z-50 animate-in fade-in duration-300">
                        <div className="flex flex-col items-center gap-10 px-10 max-w-lg w-full">
                            <div className="relative w-48 h-48">
                                <div className="absolute inset-0 bg-brand-start/20 blur-[60px] rounded-full animate-pulse" />
                                <svg className="absolute inset-0 transform -rotate-90" viewBox="0 0 192 192">
                                    <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="1" fill="transparent" className="text-subtle/30" />
                                    <circle
                                        cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="6" fill="transparent"
                                        className="text-brand-start transition-all duration-300 ease-out"
                                        strokeDasharray={552.9} strokeDashoffset={552.9 - (552.9 * exportProgress) / 100}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="font-mono text-4xl font-black text-text leading-none pb-1">{exportProgress}%</span>
                                </div>
                            </div>
                            <div className="text-center space-y-5 w-full">
                                <div className="space-y-1">
                                    <p className="text-text text-xl font-black tracking-tight uppercase italic">{exportStage}</p>
                                    <p className="text-iris text-[11px] leading-relaxed font-medium">
                                        去喝点咖啡或者茶吧，所需时间大概是歌曲长度1.5倍
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                )}

                {exportStage === EXPORT_STAGES.READY && (
                    <div className="absolute inset-0 bg-base/95 backdrop-blur-3xl flex items-center justify-center z-50 animate-in zoom-in fade-in duration-700">
                        <div className="flex flex-col items-center gap-10 text-center px-10">
                            <div className="relative">
                                <div className="absolute inset-0 bg-foam/20 blur-[80px] rounded-full animate-pulse" />
                                <div className="relative w-28 h-28 rounded-full bg-pine flex items-center justify-center shadow-[0_0_60px_rgba(40,105,131,0.34)]">
                                    <CheckCircle2 className="w-14 h-14 text-surface" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-text text-5xl font-black tracking-tighter uppercase italic">视频合成完毕</h4>
                                <p className="text-iris text-lg max-w-[360px] leading-relaxed font-medium mx-auto">
                                    视频已在浏览器内封装完成，没有任何信息留在服务器端
                                </p>
                            </div>
                            <button
                                onClick={handleDownload}
                                className="group flex items-center gap-5 px-16 py-8 rounded-full bg-pine text-surface font-black text-2xl hover:scale-105 hover:bg-foam active:scale-95 transition-all shadow-[0_30px_90px_rgba(40,105,131,0.34)]"
                            >
                                <Download className="w-8 h-8" />
                                <span>保存 {getExportProfile(selectedExportProfileId).label} MP4</span>
                            </button>
                        </div>
                    </div>
                )}

                <div className="absolute bottom-6 left-6 flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${isPlaying || isSynthesizing ? 'bg-brand-start animate-pulse' : 'bg-overlay/80'}`} />
                    <span className="text-xs font-black font-mono text-subtle/75 uppercase tracking-[0.3em]">
                        {exportStage === EXPORT_STAGES.IDLE ? (isPlaying ? 'Auditing' : 'Lobby') : 'Heavy Truck Core'}
                    </span>
                </div>

                {exportStage === EXPORT_STAGES.IDLE && (
                    <button
                        type="button"
                        onClick={onClear}
                        className="absolute top-5 right-5 z-20 flex items-center gap-2 rounded-full border border-overlay/90 bg-surface/70 px-4 py-2 text-xs font-mono uppercase tracking-[0.25em] text-subtle transition hover:bg-white hover:text-text"
                    >
                        <X className="w-4 h-4" />
                        Reset
                    </button>
                )}
            </div>

            {
                exportStage === EXPORT_STAGES.IDLE && (
                    <div className="w-full flex flex-col items-center gap-4">
                        <div className="grid w-full max-w-3xl grid-cols-2 gap-2 rounded-2xl border border-overlay/80 bg-surface/80 p-2 shadow-[0_18px_60px_rgba(87,82,121,0.08)] backdrop-blur sm:grid-cols-4">
                            {EXPORT_PROFILES.map((profile) => {
                                const isSelected = profile.id === selectedExportProfileId;
                                const isFuture = profile.id === '4k30';
                                return (
                                    <button
                                        key={profile.id}
                                        type="button"
                                        disabled={isFuture}
                                        onClick={() => setSelectedExportProfileId(profile.id)}
                                        className={`rounded-xl border px-4 py-3 text-left transition ${isSelected
                                            ? 'border-rose/35 bg-white text-text shadow-[0_12px_32px_rgba(87,82,121,0.14)]'
                                            : 'border-transparent bg-overlay/70 text-text hover:border-muted/50 hover:bg-white hover:text-text'
                                            } ${isFuture ? 'cursor-not-allowed border-transparent bg-overlay/35 text-subtle/70 opacity-80' : ''}`}
                                    >
                                        <span className={`block text-sm font-black ${isFuture ? 'text-subtle/80' : 'text-text'}`}>{profile.label}</span>
                                        <span className={`block text-[10px] font-mono uppercase tracking-[0.18em] ${isSelected ? 'text-subtle' : isFuture ? 'text-subtle/65' : 'text-subtle'}`}>
                                            {profile.description}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={handleExport}
                            className="group relative flex items-center gap-6 px-14 py-8 rounded-full font-black overflow-hidden transition-all shadow-[0_20px_50px_rgba(87,82,121,0.22)] bg-white text-text hover:scale-105 hover:bg-brand-start hover:text-surface"
                        >
                            <Zap className="w-7 h-7 fill-current" />
                            <span className="text-2xl">合成视频</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[1500ms]" />
                        </button>
                    </div>
                )
            }
        </div >
    );
}
