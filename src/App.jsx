import React, { useState, useRef, useEffect } from 'react';
import { Music, Image as ImageIcon, FileText, ChevronLeft, ChevronRight, GripVertical, Trash2 } from 'lucide-react';
import FileUpload from './components/FileUpload';
import Preview from './components/Preview';
import { generateDebugAudioBlob, generateDebugBackgroundBlob } from './utils/debugAudio';
import { parseLRC } from './utils/lrcParser';
import { DEFAULT_SCENE_PRESET_ID, SCENE_PRESETS } from './utils/scenePresets';
import { assertSupportedImageFile, createAssetRecord, createGeneratedBackgroundAsset, normalizeImageFile } from './utils/imageAssets';
import { createBackgroundTrack, DEFAULT_TRANSITION_DURATION, MOTION_PRESETS, MOTION_PRESET_LABELS, TRANSITION_STYLES, TRANSITION_STYLE_LABELS } from './utils/backgroundTrack';

export default function App() {
    const generatedBackgroundRef = useRef(createGeneratedBackgroundAsset());
    const [backgroundTrackItems, setBackgroundTrackItems] = useState([]);
    const [audio, setAudio] = useState(null);
    const [avatar, setAvatar] = useState(null);
    const [lyrics, setLyrics] = useState(null);
    const [lyricsAssetName, setLyricsAssetName] = useState(null);
    const [audioDuration, setAudioDuration] = useState(0);
    const [scenePresetId, setScenePresetId] = useState(DEFAULT_SCENE_PRESET_ID);
    const [transitionStyle, setTransitionStyle] = useState('crossfade');
    const [transitionDuration, setTransitionDuration] = useState(DEFAULT_TRANSITION_DURATION);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [draggedBackgroundIndex, setDraggedBackgroundIndex] = useState(null);
    const [dragOverBackgroundIndex, setDragOverBackgroundIndex] = useState(null);
    const [hoveredTimelineIndex, setHoveredTimelineIndex] = useState(null);
    const audioRef = useRef(null);
    const effectiveBackground = backgroundTrackItems.length > 0
        ? { type: 'track', items: backgroundTrackItems, transition: { transitionStyle, transitionDuration } }
        : generatedBackgroundRef.current;
    const backgroundTimeline = createBackgroundTrack(backgroundTrackItems, audioDuration, { transitionStyle, transitionDuration });

    const handleStart = () => {
        if (audio) setShowPreview(true);
    };

    const handleImageUpload = async (files) => {
        try {
            const normalizedFiles = await Promise.all(
                files.map(async (file) => {
                    assertSupportedImageFile(file);
                    return normalizeImageFile(file);
                })
            );
            setBackgroundTrackItems(
                normalizedFiles.map((file, index) => createAssetRecord(file, file.name || `background-${index + 1}`))
            );
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
        setAudioDuration(0);

        const objectUrl = URL.createObjectURL(file);
        const probe = document.createElement('audio');
        probe.preload = 'metadata';
        probe.src = objectUrl;
        probe.onloadedmetadata = () => {
            setAudioDuration(Number.isFinite(probe.duration) ? probe.duration : 0);
            URL.revokeObjectURL(objectUrl);
        };
        probe.onerror = () => {
            URL.revokeObjectURL(objectUrl);
        };
    };

    const moveBackgroundItem = (index, direction) => {
        setBackgroundTrackItems((items) => {
            const nextIndex = index + direction;
            if (nextIndex < 0 || nextIndex >= items.length) return items;

            const nextItems = [...items];
            const [item] = nextItems.splice(index, 1);
            nextItems.splice(nextIndex, 0, item);
            return nextItems;
        });
    };

    const removeBackgroundItem = (index) => {
        setBackgroundTrackItems((items) => items.filter((_, itemIndex) => itemIndex !== index));
    };

    const updateBackgroundItemMotion = (index, motionPreset) => {
        setBackgroundTrackItems((items) => items.map((item, itemIndex) => (
            itemIndex === index
                ? { ...item, motionPreset }
                : item
        )));
    };

    const reorderBackgroundItems = (fromIndex, toIndex) => {
        setBackgroundTrackItems((items) => {
            if (
                fromIndex === toIndex ||
                fromIndex < 0 ||
                toIndex < 0 ||
                fromIndex >= items.length ||
                toIndex >= items.length
            ) {
                return items;
            }

            const nextItems = [...items];
            const [movedItem] = nextItems.splice(fromIndex, 1);
            nextItems.splice(toIndex, 0, movedItem);
            return nextItems;
        });
    };

    const handleBackgroundDragStart = (index) => {
        setDraggedBackgroundIndex(index);
        setDragOverBackgroundIndex(index);
    };

    const handleBackgroundDragOver = (event, index) => {
        event.preventDefault();
        if (dragOverBackgroundIndex !== index) {
            setDragOverBackgroundIndex(index);
        }
    };

    const handleBackgroundDrop = (index) => {
        if (draggedBackgroundIndex === null) return;
        reorderBackgroundItems(draggedBackgroundIndex, index);
        setDraggedBackgroundIndex(null);
        setDragOverBackgroundIndex(null);
    };

    const resetBackgroundDragState = () => {
        setDraggedBackgroundIndex(null);
        setDragOverBackgroundIndex(null);
    };

    const handleTimelineHover = (index) => {
        setHoveredTimelineIndex(index);
    };

    const clearTimelineHover = () => {
        setHoveredTimelineIndex(null);
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
            setAudioDuration(8);
            setBackgroundTrackItems([createAssetRecord(debugBackgroundFile, debugBackgroundFile.name)]);

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
        setBackgroundTrackItems([]);
        setAvatar(null);
        setAudio(null);
        setLyrics(null);
        setLyricsAssetName(null);
        setAudioDuration(0);
        setTransitionStyle('crossfade');
        setTransitionDuration(DEFAULT_TRANSITION_DURATION);
        setIsPlaying(false);
        setShowPreview(false);
    };

    const shouldUsePreciseTimelineLabels = (seconds) => Number.isFinite(seconds) && seconds > 0 && seconds < 60;

    const formatDuration = (seconds, options = {}) => {
        const { precise = false } = options;
        if (!Number.isFinite(seconds) || seconds < 0) return '--:--';
        if (precise) {
            const totalTenths = Math.max(0, Math.round(seconds * 10));
            const minutes = Math.floor(totalTenths / 600);
            const remainTenths = totalTenths % 600;
            const remainSeconds = Math.floor(remainTenths / 10);
            const tenths = remainTenths % 10;
            return `${minutes}:${String(remainSeconds).padStart(2, '0')}.${tenths}`;
        }

        const wholeSeconds = Math.max(0, Math.round(seconds));
        const minutes = Math.floor(wholeSeconds / 60);
        const remainSeconds = wholeSeconds % 60;
        return `${minutes}:${String(remainSeconds).padStart(2, '0')}`;
    };

    const usePreciseTimelineLabels = shouldUsePreciseTimelineLabels(backgroundTimeline.at(-1)?.endTime || audioDuration);

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
                                    label="上传背景图片（可多选）"
                                    onUpload={handleImageUpload}
                                    file={backgroundTrackItems}
                                    multiple
                                />
                                <p className="px-2 text-center text-sm leading-relaxed text-subtle">
                                    你可以一次选择多张背景图。未上传时，系统会自动使用动态背景。
                                </p>

                                {backgroundTrackItems.length > 0 && (
                                    <div className="rounded-[28px] border border-overlay bg-surface/70 p-4 shadow-sm">
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <h3 className="text-sm font-black tracking-tight text-text">背景轨道</h3>
                                                <p className="mt-1 text-xs font-mono uppercase tracking-[0.22em] text-subtle">
                                                    当前顺序即播放顺序
                                                </p>
                                            </div>
                                            <span className="rounded-full bg-overlay px-3 py-1 text-xs font-mono uppercase tracking-[0.22em] text-subtle">
                                                {backgroundTrackItems.length} items
                                            </span>
                                        </div>

                                        <div className="mt-4 grid grid-cols-1 gap-3">
                                        <div className="sticky top-0 z-10 rounded-2xl border border-overlay/80 bg-white/90 p-3 shadow-sm backdrop-blur">
                                            <div className="mb-4 rounded-2xl border border-overlay/70 bg-surface/80 p-3">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div>
                                                        <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-subtle">
                                                            Transition
                                                        </p>
                                                        <p className="mt-1 text-sm font-medium text-text">
                                                            {TRANSITION_STYLE_LABELS[transitionStyle]}
                                                        </p>
                                                    </div>
                                                    <span className="rounded-full bg-overlay px-3 py-1 text-xs font-mono uppercase tracking-[0.18em] text-subtle">
                                                        {transitionDuration.toFixed(1)}s
                                                    </span>
                                                </div>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {TRANSITION_STYLES.map((style) => {
                                                        const isActive = transitionStyle === style;
                                                        return (
                                                            <button
                                                                key={style}
                                                                type="button"
                                                                onClick={() => setTransitionStyle(style)}
                                                                className={`rounded-full border px-3 py-1.5 text-xs font-mono uppercase tracking-[0.18em] transition ${
                                                                    isActive
                                                                        ? 'border-text bg-text text-base'
                                                                        : 'border-overlay bg-white text-subtle hover:border-muted hover:text-text'
                                                                }`}
                                                            >
                                                                {TRANSITION_STYLE_LABELS[style]}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="2"
                                                    step="0.1"
                                                    value={transitionDuration}
                                                    onChange={(event) => setTransitionDuration(Number(event.target.value))}
                                                    className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-overlay"
                                                    aria-label="Background transition duration"
                                                />
                                            </div>

                                            <div className="flex items-center justify-between gap-3">
                                                <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-subtle">
                                                    Timeline
                                                </p>
                                                    <p className="text-xs font-medium text-subtle">
                                                        Total {formatDuration(backgroundTimeline.at(-1)?.endTime || audioDuration)}
                                                    </p>
                                                </div>
                                                <div className="mt-3 overflow-hidden rounded-full bg-overlay">
                                                    <div className="flex h-3 w-full gap-px bg-overlay">
                                                        {backgroundTimeline.map((item) => (
                                                            <div
                                                                key={`timeline-${item.id}`}
                                                                onMouseEnter={() => handleTimelineHover(item.index)}
                                                                onMouseLeave={clearTimelineHover}
                                                                className={`relative min-w-[14px] bg-gradient-to-r from-brand-start to-brand-end transition-all ${
                                                                    hoveredTimelineIndex === item.index
                                                                        ? 'brightness-110 saturate-150'
                                                                        : hoveredTimelineIndex !== null
                                                                            ? 'opacity-45'
                                                                            : ''
                                                                }`}
                                                                style={{ flexGrow: item.duration, flexBasis: 0 }}
                                                                title={`${item.asset.name}: ${formatDuration(item.startTime, { precise: usePreciseTimelineLabels })} - ${formatDuration(item.endTime, { precise: usePreciseTimelineLabels })}`}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="mt-3 grid grid-cols-1 gap-2">
                                                    {backgroundTimeline.map((item, index) => (
                                                        <div
                                                            key={`timeline-label-${item.id}`}
                                                            onMouseEnter={() => handleTimelineHover(index)}
                                                            onMouseLeave={clearTimelineHover}
                                                            className={`flex items-center justify-between gap-3 rounded-xl px-2 py-1 text-xs transition-colors ${
                                                                hoveredTimelineIndex === index
                                                                    ? 'bg-overlay/80 text-text'
                                                                    : 'text-subtle'
                                                            }`}
                                                        >
                                                            <span className={`truncate font-medium ${hoveredTimelineIndex === index ? 'text-text' : 'text-text'}`}>
                                                                Scene {index + 1}
                                                            </span>
                                                            <span className="font-mono">
                                                                {formatDuration(item.startTime, { precise: usePreciseTimelineLabels })} - {formatDuration(item.endTime, { precise: usePreciseTimelineLabels })}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="max-h-[34rem] overflow-y-auto pr-1">
                                                <div className="grid grid-cols-1 gap-3">
                                                    {backgroundTrackItems.map((item, index) => (
                                                        <div
                                                            key={`${item.name}-${index}`}
                                                            draggable={backgroundTrackItems.length > 1}
                                                            onDragStart={() => handleBackgroundDragStart(index)}
                                                            onDragOver={(event) => handleBackgroundDragOver(event, index)}
                                                            onDrop={() => handleBackgroundDrop(index)}
                                                            onDragEnd={resetBackgroundDragState}
                                                            onMouseEnter={() => handleTimelineHover(index)}
                                                            onMouseLeave={clearTimelineHover}
                                                            className={`grid grid-cols-1 gap-3 rounded-2xl border border-overlay/80 bg-white/60 p-3 transition-all sm:grid-cols-[72px_1fr_auto] ${
                                                                draggedBackgroundIndex === index ? 'scale-[0.98] opacity-70' : ''
                                                            } ${
                                                                dragOverBackgroundIndex === index && draggedBackgroundIndex !== index
                                                                    ? 'border-muted bg-white shadow-[0_12px_28px_rgba(87,82,121,0.12)]'
                                                                    : ''
                                                            } ${
                                                                hoveredTimelineIndex === index
                                                                    ? 'border-muted bg-white shadow-[0_14px_32px_rgba(87,82,121,0.14)]'
                                                                    : hoveredTimelineIndex !== null
                                                                        ? 'opacity-80'
                                                                        : ''
                                                            }`}
                                                        >
                                                            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-overlay">
                                                                <img
                                                                    src={item.url}
                                                                    alt={item.name}
                                                                    className="h-full w-full object-cover"
                                                                />
                                                                {backgroundTrackItems.length > 1 && (
                                                                    <div className="absolute left-2 top-2 rounded-full border border-white/50 bg-black/35 p-1 text-white shadow-sm">
                                                                        <GripVertical className="h-4 w-4" />
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="min-w-0">
                                                                <div className="flex items-baseline justify-between gap-3">
                                                                    <p className="text-xs font-mono uppercase tracking-[0.22em] text-subtle">
                                                                        Scene {index + 1}
                                                                    </p>
                                                                    {backgroundTrackItems.length > 1 && (
                                                                        <p className="text-[11px] font-medium text-subtle">
                                                                            Drag to reorder
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                <p className="mt-1 truncate text-sm font-bold text-text">
                                                                    {item.name}
                                                                </p>
                                                                <div className="mt-2">
                                                                    <label className="block text-[11px] font-mono uppercase tracking-[0.22em] text-subtle">
                                                                        Motion
                                                                    </label>
                                                                    <select
                                                                        value={item.motionPreset || MOTION_PRESETS[index % MOTION_PRESETS.length]}
                                                                        onChange={(event) => updateBackgroundItemMotion(index, event.target.value)}
                                                                        className="mt-1 w-full rounded-xl border border-overlay bg-white px-3 py-2 text-sm font-medium text-text outline-none transition focus:border-muted"
                                                                        aria-label={`Motion preset for ${item.name}`}
                                                                    >
                                                                        {MOTION_PRESETS.map((preset) => (
                                                                            <option key={preset} value={preset}>
                                                                                {MOTION_PRESET_LABELS[preset]}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center justify-end gap-2 sm:justify-start">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => moveBackgroundItem(index, -1)}
                                                                    disabled={index === 0}
                                                                    className="rounded-full border border-overlay bg-surface p-2 text-text transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-35"
                                                                    aria-label={`Move ${item.name} left`}
                                                                >
                                                                    <ChevronLeft className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => moveBackgroundItem(index, 1)}
                                                                    disabled={index === backgroundTrackItems.length - 1}
                                                                    className="rounded-full border border-overlay bg-surface p-2 text-text transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-35"
                                                                    aria-label={`Move ${item.name} right`}
                                                                >
                                                                    <ChevronRight className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeBackgroundItem(index)}
                                                                    className="rounded-full border border-rose/30 bg-white p-2 text-rose transition hover:bg-rose hover:text-white"
                                                                    aria-label={`Remove ${item.name}`}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
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
