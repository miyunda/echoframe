const DEFAULT_SLOT_DURATION = 4;
export const DEFAULT_TRANSITION_DURATION = 0.8;
export const TRANSITION_STYLES = ['crossfade', 'flash'];
export const TRANSITION_STYLE_LABELS = {
    crossfade: 'Crossfade',
    flash: 'Flash',
};
export const MOTION_PRESETS = ['zoom-in', 'zoom-out', 'pan-left', 'pan-right', 'drift'];

export const MOTION_PRESET_LABELS = {
    'zoom-in': 'Zoom In',
    'zoom-out': 'Zoom Out',
    'pan-left': 'Pan Left',
    'pan-right': 'Pan Right',
    drift: 'Drift',
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const createBackgroundTrack = (items, duration = 0, options = {}) => {
    if (!items?.length) return [];

    const transitionDurationLimit = Number.isFinite(options.transitionDuration)
        ? Math.max(0, options.transitionDuration)
        : DEFAULT_TRANSITION_DURATION;
    const effectiveDuration = duration > 0
        ? duration
        : Math.max(items.length * DEFAULT_SLOT_DURATION, DEFAULT_SLOT_DURATION);
    const slotDuration = effectiveDuration / items.length;

    return items.map((item, index) => {
        const startTime = index * slotDuration;
        const endTime = startTime + slotDuration;
        const transitionDuration = index < items.length - 1
            ? Math.min(transitionDurationLimit, slotDuration * 0.45)
            : 0;

        return {
            id: item.id || `bg-${index}`,
            asset: item,
            index,
            startTime,
            endTime,
            duration: slotDuration,
            fitMode: 'cover',
            motionPreset: item.motionPreset || MOTION_PRESETS[index % MOTION_PRESETS.length],
            transitionStyle: options.transitionStyle || 'crossfade',
            transitionDuration,
        };
    });
};

export const resolveBackgroundFrame = (track, time = 0) => {
    if (!track?.length) return null;

    const totalDuration = track[track.length - 1].endTime;
    const clampedTime = clamp(time, 0, Math.max(0, totalDuration - 0.0001));
    const currentItem = track.find((item) => clampedTime >= item.startTime && clampedTime < item.endTime) || track[track.length - 1];
    const nextItem = track[currentItem.index + 1] || null;
    const localProgress = currentItem.duration > 0
        ? clamp((clampedTime - currentItem.startTime) / currentItem.duration, 0, 1)
        : 0;

    let transitionProgress = 0;
    if (nextItem && currentItem.transitionDuration > 0) {
        const transitionStart = currentItem.endTime - currentItem.transitionDuration;
        if (clampedTime >= transitionStart) {
            transitionProgress = clamp(
                (clampedTime - transitionStart) / currentItem.transitionDuration,
                0,
                1
            );
        }
    }

    return {
        currentItem,
        nextItem,
        localProgress,
        nextLocalProgress: nextItem?.duration
            ? clamp((clampedTime - nextItem.startTime) / nextItem.duration, 0, 1)
            : 0,
        transitionProgress,
        totalDuration,
    };
};

export const getMotionTransform = (motionPreset, progress) => {
    const p = clamp(progress, 0, 1);

    switch (motionPreset) {
        case 'zoom-in':
            return { scale: 1.04 + p * 0.14, x: 0, y: -0.04 + p * 0.04 };
        case 'zoom-out':
            return { scale: 1.18 - p * 0.12, x: 0, y: 0.02 - p * 0.02 };
        case 'pan-left':
            return { scale: 1.12, x: 0.08 - p * 0.16, y: -0.01 };
        case 'pan-right':
            return { scale: 1.12, x: -0.08 + p * 0.16, y: 0.01 };
        case 'drift':
        default:
            return {
                scale: 1.1 + Math.sin(p * Math.PI) * 0.03,
                x: Math.sin(p * Math.PI * 2) * 0.035,
                y: Math.cos(p * Math.PI * 2) * 0.025,
            };
    }
};
