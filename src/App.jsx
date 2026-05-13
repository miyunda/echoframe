import React, { useState, useRef, useEffect } from 'react';
import { Music, Image as ImageIcon, FileText } from 'lucide-react';
import FileUpload from './components/FileUpload';
import Preview from './components/Preview';
import { generateDebugAudioBlob, generateDebugBackgroundBlob } from './utils/debugAudio';
import { parseLRC } from './utils/lrcParser';
import { DEFAULT_SCENE_PRESET_ID, SCENE_PRESETS } from './utils/scenePresets';
import { assertSupportedImageFile, createAssetRecord, createGeneratedBackgroundAsset, normalizeImageFile } from './utils/imageAssets';

export default function App() {
    const generatedBackgroundRef = useRef(createGeneratedBackgroundAsset());
    const [background, setBackground] = useState(null);
    const [audio, setAudio] = useState(null);
    const [avatar, setAvatar] = useState(null);
    const [lyrics, setLyrics] = useState(null);
    const [lyricsAssetName, setLyricsAssetName] = useState(null);
    const [scenePresetId, setScenePresetId] = useState(DEFAULT_SCENE_PRESET_ID);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const audioRef = useRef(null);
    const effectiveBackground = background || generatedBackgroundRef.current;

    const handleStart = () => {
        if (audio) setShowPreview(true);
    };

    const handleImageUpload = async (file) => {
        try {
            assertSupportedImageFile(file);
            const normalizedFile = await normalizeImageFile(file);
            setBackground(createAssetRecord(normalizedFile));
        } catch (error) {
            console.error('Failed to prepare background image:', error);
            alert(`背景图片处理失败：${error.message}`);
        }
    };

    const handleAvatarUpload = async (file) => {
        try {
            assertSupportedImageFile(file);
            const normalizedFile = await normalizeImageFile(file);
            setAvatar(createAssetRecord(normalizedFile));
        } catch (error) {
            console.error('Failed to prepare avatar image:', error);
            alert(`头像图片处理失败：${error.message}`);
        }
    };

    const handleAudioUpload = (file) => {
        setAudio(createAssetRecord(file, file.name));
    };

    const handleLrcUpload = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const parsed = parseLRC(text);
            setLyrics(parsed);
            setLyricsAssetName(file.name);
        };
        reader.readAsText(file);
    };

    const handleDebugAudio = async () => {
        try {
            const [audioBlob, backgroundBlob] = await Promise.all([
                generateDebugAudioBlob(),
                generateDebugBackgroundBlob(),
            ]);

            const debugAudioFile = new File([audioBlob], 'DEBUG_STEREO_TEST.wav', { type: 'audio/wav' });
            const debugBackgroundFile = new File([backgroundBlob], 'DEBUG_BACKGROUND.png', { type: 'image/png' });

            setAudio(createAssetRecord(debugAudioFile, debugAudioFile.name));
            setBackground(createAssetRecord(debugBackgroundFile, debugBackgroundFile.name));

            // Generate Test Lyrics
            const lrcContent = `
[00:00.00] 您现在听到的是：左声道 (440Hz A4) | You are listening to: Left Channel (440Hz A4)
[00:02.00] 您现在听到的是：双声道中间 (880Hz A5) | You are listening to: Center (880Hz A5)
[00:04.00] 您现在听到的是：右声道 (440Hz A4) | You are listening to: Right Channel (440Hz A4)
[00:06.00] 测试结束 | Test Finished
`;
            setLyrics(parseLRC(lrcContent));
            setLyricsAssetName('DEBUG_STEREO_TEST.lrc');
        } catch (e) {
            console.error("Failed to generate debug audio:", e);
            alert("Debug audio generation failed");
        }
    };
    const clearFiles = () => {
        setBackground(null);
        setAvatar(null);
        setAudio(null);
        setLyrics(null);
        setLyricsAssetName(null);
        setIsPlaying(false);
        setShowPreview(false);
    };

    useEffect(() => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.play().catch(e => console.error("Playback failed:", e));
        } else {
            audioRef.current.pause();
        }
    }, [isPlaying]);

    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-6 sm:p-12 bg-base text-text">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-start/10 blur-[120px] rounded-full pointer-events-none" />

            {/* Main Content */}
            <div className="relative z-10 w-full max-w-4xl flex flex-col items-center gap-8">
                <header className="text-center space-y-2">
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-start to-brand-end">
                        EchoFrame
                    </h1>
                    <p className="text-text font-medium mt-2">
                        简单易用的音频可视化视频生成工具
                    </p>
                </header>

                {!showPreview ? (
                    <>
                        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="w-full space-y-4">
                                <FileUpload
                                    type="image"
                                    accept="image/*"
                                    icon={<ImageIcon className="w-8 h-8 text-brand-start" />}
                                    label="上传背景图片（可选）"
                                    onUpload={handleImageUpload}
                                    file={background?.type === 'image' ? background : null}
                                />
                                <p className="px-2 text-center text-sm leading-relaxed text-subtle">
                                    未上传背景图时，系统会自动使用动态背景。
                                </p>
                            </div>
                            <FileUpload
                                type="audio"
                                accept="audio/*"
                                icon={<Music className="w-8 h-8 text-brand-end" />}
                                label="上传音频文件"
                                onUpload={handleAudioUpload}
                                file={audio}
                            />
                        </div>

                        {/* Styles for Optional Uploads */}
                        <div className="w-full mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FileUpload
                                type="image"
                                accept="image/*"
                                icon={<ImageIcon className="w-8 h-8 text-iris" />}
                                label="上传人物/Logo (可选)"
                                onUpload={handleAvatarUpload}
                                file={avatar}
                            />
                            <FileUpload
                                type="text"
                                accept=".lrc,.txt"
                                icon={<FileText className="w-8 h-8 text-subtle" />}
                                label="上传歌词文件 (LRC) - 可选"
                                onUpload={handleLrcUpload}
                                file={lyricsAssetName ? { name: lyricsAssetName } : null}
                            />
                        </div>

                        <section className="w-full mt-6 space-y-4">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-text text-lg font-black tracking-tight">选择视觉场景</h2>
                                    <p className="text-subtle text-xs font-mono uppercase tracking-[0.2em]">
                                        Preview and export share the same renderer
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {SCENE_PRESETS.map((preset) => {
                                    const isSelected = preset.id === scenePresetId;
                                    return (
                                        <button
                                            key={preset.id}
                                            type="button"
                                            onClick={() => setScenePresetId(preset.id)}
                                            className={`text-left p-5 rounded-3xl border transition-all duration-300 shadow-sm ${
                                                isSelected
                                                    ? 'bg-text text-base border-text shadow-[0_20px_45px_rgba(87,82,121,0.22)]'
                                                    : 'bg-surface/80 text-text border-overlay hover:border-muted hover:bg-white'
                                            }`}
                                        >
                                            <p className="text-xs font-mono uppercase tracking-[0.3em] opacity-60">
                                                {preset.title}
                                            </p>
                                            <h3 className="mt-2 text-xl font-black tracking-tight">{preset.name}</h3>
                                            <p className={`mt-3 text-sm leading-relaxed ${isSelected ? 'text-base/75' : 'text-subtle'}`}>
                                                {preset.description}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Control Actions */}
                        <div className="w-full flex flex-col items-center mt-10 gap-6">
                            <button
                                onClick={handleStart}
                                disabled={!audio}
                                className={`
                                    relative px-12 py-4 rounded-full font-bold text-xl transition-all duration-300 shadow-xl
                                    ${audio
                                        ? 'bg-white text-black hover:scale-105 hover:bg-brand-start hover:text-white cursor-pointer'
                                        : 'bg-white/5 text-white/20 cursor-not-allowed grayscale'
                                    }
                                `}
                            >
                                进入可视化工作台
                            </button>

                            <button
                                onClick={handleDebugAudio}
                                className="text-subtle hover:text-text text-xs underline underline-offset-4 cursor-pointer transition-colors"
                            >
                                🛠️ 点这里生成测试用音频和字幕
                            </button>
                        </div>
                    </>
                ) : (
                    <Preview
                        background={effectiveBackground}
                        audio={audio}
                        avatar={avatar}
                        audioRef={audioRef}
                        isPlaying={isPlaying}
                        setIsPlaying={setIsPlaying}
                        onClear={clearFiles}
                        lyrics={lyrics}
                        scenePresetId={scenePresetId}
                    />
                )}

                {/* Hidden Audio Element */}
                {audio && (
                    <audio
                        ref={audioRef}
                        src={audio.url}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onEnded={() => setIsPlaying(false)}
                    />
                )}

                <footer className="mt-8 text-subtle text-xs font-mono uppercase tracking-widest">
                    &copy; 2026 <a href="https://miyunda.com" target="_blank" rel="noreferrer" className="hover:text-text transition-colors underline decoration-white/30">Miyunda</a> <a href="https://github.com/miyunda/echoframe" target="_blank" rel="noreferrer" className="hover:text-text transition-colors underline decoration-white/30">EchoFrame Project</a>. For who loves 🎵, by who loves 🎵.
                </footer>
            </div>
        </div>
    );
}
