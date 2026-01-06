import React, { useState, useRef, useEffect } from 'react';
import { Upload, Music, Image as ImageIcon, X, Play, Pause, FileText } from 'lucide-react';
import FileUpload from './components/FileUpload';
import Preview from './components/Preview';
import { generateDebugAudioBlob } from './utils/debugAudio';
import { parseLRC } from './utils/lrcParser';

export default function App() {
    const [image, setImage] = useState(null);
    const [audio, setAudio] = useState(null);
    const [avatar, setAvatar] = useState(null);
    const [lyrics, setLyrics] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const audioRef = useRef(null);

    const handleStart = () => {
        if (image && audio) setShowPreview(true);
    };

    const handleImageUpload = (file) => {
        const url = URL.createObjectURL(file);
        setImage({ file, url });
    };

    const handleAvatarUpload = (file) => {
        const url = URL.createObjectURL(file);
        setAvatar({ file, url });
    };

    const handleAudioUpload = (file) => {
        const url = URL.createObjectURL(file);
        setAudio({ file, url, name: file.name });
    };

    const handleLrcUpload = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const parsed = parseLRC(text);
            setLyrics(parsed);
        };
        reader.readAsText(file);
    };

    const handleDebugAudio = async () => {
        try {
            const blob = await generateDebugAudioBlob();
            const url = URL.createObjectURL(blob);
            setAudio({ file: blob, url, name: "DEBUG_STEREO_TEST.wav" });

            // Generate Test Lyrics
            const lrcContent = `
[00:00.00] 您现在听到的是：左声道 (440Hz A4)
[00:02.00] 您现在听到的是：双声道中间 (880Hz A5)
[00:04.00] 您现在听到的是：右声道 (440Hz A4)
[00:06.00] 测试结束
`;
            setLyrics(parseLRC(lrcContent));
        } catch (e) {
            console.error("Failed to generate debug audio:", e);
            alert("Debug audio generation failed");
        }
    };



    const handleGenerateLrc = () => {
        const content = `[00:00.00] 您现在听到的是：左声道 (440Hz A4)
[00:02.00] 您现在听到的是：双声道中间 (880Hz A5)
[00:04.00] 您现在听到的是：右声道 (440Hz A4)
[00:06.00] 测试结束`;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'test_stereo.lrc';
        a.click();
        URL.revokeObjectURL(url);
    };

    const clearFiles = () => {
        setImage(null);
        setAvatar(null);
        setAudio(null);
        setLyrics(null);
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
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-6 sm:p-12 overflow-hidden bg-base text-text">
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
                            <FileUpload
                                type="image"
                                accept="image/*"
                                icon={<ImageIcon className="w-8 h-8 text-brand-start" />}
                                label="上传背景图片"
                                onUpload={handleImageUpload}
                                file={image}
                            />
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
                                file={lyrics ? { file: { name: "Lyrics Loaded" } } : null}
                            />
                        </div>

                        {/* Control Actions */}
                        <div className="w-full flex flex-col items-center mt-10 gap-6">
                            <button
                                onClick={handleStart}
                                disabled={!image || !audio}
                                className={`
                                    relative px-12 py-4 rounded-full font-bold text-xl transition-all duration-300 shadow-xl
                                    ${image && audio
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
                        image={image}
                        audio={audio}
                        avatar={avatar}
                        audioRef={audioRef}
                        isPlaying={isPlaying}
                        setIsPlaying={setIsPlaying}
                        onClear={clearFiles}
                        lyrics={lyrics}
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
