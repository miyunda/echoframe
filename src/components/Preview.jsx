import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Play, Pause, X, Download, Loader2, CheckCircle2, Zap, Cog } from 'lucide-react';
import Visualizer from './Visualizer';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { drawStereoBars, detectBass, drawLyrics } from '../utils/visualizerUtils';
import { extractFrequencyData } from '../utils/offlineProcessor';

const EXPORT_STAGES = {
    IDLE: 'idle',
    INITIALIZING: '正在初始化引擎...',
    ANALYZING: '预分析音频数据...',
    RENDERING: '分帧渲染影像中...',
    ENCODING: '合并视音频压制中...',
    READY: 'ready'
};

export default function Preview({ image, audio, audioRef, isPlaying, setIsPlaying, onClear, lyrics, avatar }) {
    const [bassScale, setBassScale] = useState(1);
    const [exportStage, setExportStage] = useState(EXPORT_STAGES.IDLE);
    const [exportProgress, setExportProgress] = useState(0);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const visualizerRef = useRef(null);
    const ffmpegRef = useRef(new FFmpeg());

    const handleBassPulse = useCallback(() => {
        setBassScale(1.05);
        setTimeout(() => setBassScale(1), 100);
    }, []);

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
            console.log("FFmpeg overhaul started");
            setExportProgress(0);

            // 1. Initialize Engine
            setIsPlaying(false); // Stop playback before export
            setExportStage(EXPORT_STAGES.INITIALIZING);
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

            // 2. Audio Analysis
            setExportStage(EXPORT_STAGES.ANALYZING);
            const { leftFrequencyDataSequence, rightFrequencyDataSequence, totalFrames } = await extractFrequencyData(
                audio.file,
                512,
                (p) => setExportProgress(Math.floor(p * 10)) // 0-10%
            );

            // Write audio to ffmpeg FS
            const audioData = await fetchFile(audio.file);
            await ffmpeg.writeFile('audio.mp3', audioData);

            // 3. Rendering Phase
            setExportStage(EXPORT_STAGES.RENDERING);
            const FPS = 60; // Define constant FPS
            const width = 1920;
            const height = 1080;
            const canvas = new OffscreenCanvas(width, height);
            const ctx = canvas.getContext('2d');
            const bgImage = await createImageBitmap(image.file);
            // Load Avatar Bitmap if exists
            let avatarImage = null;
            if (avatar && avatar.file) {
                avatarImage = await createImageBitmap(avatar.file);
            }

            const barsStateLeft = Array(256).fill(0);
            const barsStateRight = Array(256).fill(0);
            let currentAvatarY = 0;

            for (let i = 0; i < totalFrames; i++) {
                // Calculate precise virtual time for this frame
                const virtualTime = i / FPS;

                const leftData = leftFrequencyDataSequence[i] || leftFrequencyDataSequence[leftFrequencyDataSequence.length - 1];
                const rightData = rightFrequencyDataSequence[i] || rightFrequencyDataSequence[rightFrequencyDataSequence.length - 1];
                ctx.clearRect(0, 0, width, height);

                // Use max bass for scale effect
                const isBass = detectBass(leftData) || detectBass(rightData);
                const scale = isBass ? 1.05 : 1;

                ctx.save();
                ctx.translate(width / 2, height / 2);
                ctx.scale(scale, scale);
                ctx.drawImage(bgImage, -width / 2, -height / 2, width, height);
                ctx.restore();

                ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                ctx.fillRect(0, 0, width, height);

                // Draw Avatar (Offline Rendering)
                if (avatarImage) {
                    // Calculate Bass Energy
                    const bassBinCount = 5;
                    let bassSum = 0;
                    for (let j = 0; j < bassBinCount; j++) {
                        bassSum += Math.max(leftData[j] || 0, rightData[j] || 0);
                    }
                    const bassAvg = bassSum / bassBinCount;

                    // Target Offset
                    const targetOffset = - (bassAvg / 255) * (height * 0.12);

                    // Apply Smoothing
                    const smoothing = 0.4;
                    currentAvatarY += (targetOffset - currentAvatarY) * smoothing;

                    // Keep size constant
                    const size = Math.min(width, height) * 0.6;

                    const x = (width - size) / 2;
                    // Add offset to Y
                    const y = ((height - size) / 2) + currentAvatarY;

                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(width / 2, y + size / 2, size / 2, 0, Math.PI * 2);
                    ctx.clip();

                    const imgSize = Math.min(avatarImage.width, avatarImage.height);
                    const sx = (avatarImage.width - imgSize) / 2;
                    const sy = (avatarImage.height - imgSize) / 2;

                    ctx.drawImage(avatarImage, sx, sy, imgSize, imgSize, x, y, size, size);

                    // Optional: Add a border (match Visualizer)
                    ctx.lineWidth = 4;
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                    ctx.stroke();

                    ctx.restore();
                }


                const vizWidth = width * 0.7;
                const vizHeight = height * 0.3;
                ctx.save();
                ctx.translate((width - vizWidth) / 2, height * 0.75);
                drawStereoBars(
                    ctx,
                    leftData,
                    rightData,
                    barsStateLeft,
                    barsStateRight,
                    vizWidth,
                    vizHeight,
                    { gravity: 3.0 }
                );
                ctx.restore();

                // Draw Title (Moved to Top)
                ctx.fillStyle = 'white';
                ctx.font = 'bold 60px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(audio.name, width / 2, height * 0.35); // 35% height (Above visualizer)

                // Draw Lyrics (Will be drawn at bottom by visualizerUtils)
                if (lyrics) {
                    // Use calculated virtualTime instead of i / 30
                    drawLyrics(ctx, lyrics, virtualTime, width, height);
                }

                // Convert to PNG blob and write to memory FS
                const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.9 });
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
                '-b:v', '8000k',
                // '-an', // No audio
                'video.mp4'
            ]);

            // 5. Muxing Phase (Step 2: Merge Audio)
            setExportProgress(95);
            // setExportStage("Finalizing Mux...");

            await ffmpeg.exec([
                '-i', 'video.mp4',
                '-i', 'audio.mp3',
                '-c:v', 'copy', // Copy video stream (no re-encode)
                '-c:a', 'aac',  // Re-encode audio to aac for mp4 compatibility
                '-shortest',
                'output.mp4'
            ]);

            const data = await ffmpeg.readFile('output.mp4');
            const blob = new Blob([data.buffer], { type: 'video/mp4' });
            setDownloadUrl(URL.createObjectURL(blob));

            // Cleanup FS
            await ffmpeg.deleteFile('audio.mp3');
            await ffmpeg.deleteFile('video.mp4');
            await ffmpeg.deleteFile('output.mp4');
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
            <div className="w-full relative aspect-video sm:aspect-[21/9] rounded-2xl overflow-hidden glass group animate-in fade-in zoom-in duration-500 shadow-2xl shadow-black/50">
                <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-300 ease-out"
                    style={{
                        backgroundImage: `url(${image.url})`,
                        transform: `scale(${bassScale})`
                    }}
                />

                <div className="absolute inset-0 bg-surface/60 backdrop-blur-[2px]" />

                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 pointer-events-none">
                    {/* Title Section (Moved to Top) */}
                    <div className="mb-12 text-center space-y-1 text-white text-opacity-80">
                        <h3 className="text-xl font-bold tracking-tight drop-shadow-lg">{audio.name}</h3>
                        <p className="text-white/40 text-[10px] uppercase tracking-[0.4em] font-mono">Generated by EchoFrame</p>
                    </div>

                    <div className="w-full max-w-2xl h-48 flex items-end justify-center">
                        <Visualizer
                            ref={visualizerRef}
                            audioRef={audioRef}
                            isPlaying={isPlaying}
                            onBassPulse={handleBassPulse}
                            lyrics={lyrics}
                            avatar={avatar}
                        />
                    </div>
                </div>

                {exportStage === EXPORT_STAGES.IDLE && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                        <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="p-6 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all transform hover:scale-110 active:scale-95 border border-white/20"
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
                                <div className="absolute inset-0 bg-green-500/20 blur-[80px] rounded-full animate-pulse" />
                                <div className="relative w-28 h-28 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(34,197,94,0.4)]">
                                    <CheckCircle2 className="w-14 h-14 text-black" />
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
                                className="group flex items-center gap-5 px-16 py-8 rounded-full bg-white text-black font-black text-2xl hover:bg-green-500 hover:text-black hover:scale-105 active:scale-95 transition-all shadow-[0_30px_90px_rgba(0,0,0,0.6)]"
                            >
                                <Download className="w-8 h-8" />
                                <span>保存 1080p MP4</span>
                            </button>
                        </div>
                    </div>
                )}

                <div className="absolute bottom-6 left-6 flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${isPlaying || isSynthesizing ? 'bg-brand-start animate-pulse' : 'bg-white/10'}`} />
                    <span className="text-xs font-black font-mono text-white/30 uppercase tracking-[0.3em]">
                        {exportStage === EXPORT_STAGES.IDLE ? (isPlaying ? 'Auditing' : 'Lobby') : 'Heavy Truck Core'}
                    </span>
                </div>
            </div>

            {
                exportStage === EXPORT_STAGES.IDLE && (
                    <div className="w-full flex flex-col items-center gap-4">
                        <button
                            onClick={handleExport}
                            className="group relative flex items-center gap-6 px-14 py-8 rounded-full font-black overflow-hidden transition-all shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-white text-black hover:scale-105 hover:bg-brand-start hover:text-white"
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
