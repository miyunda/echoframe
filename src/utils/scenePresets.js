export const DEFAULT_SCENE_PRESET_ID = 'classic-stereo';

export const SCENE_PRESETS = [
    {
        id: 'classic-stereo',
        name: 'Classic Stereo',
        description: 'Preserve the legacy red and blue analyzer layout.',
        style: 'stereo',
        title: '红蓝监测',
        theme: {
            backgroundOverlay: 'rgba(8, 10, 18, 0.46)',
            accent: '#ffffff',
            subtitle: 'rgba(255, 255, 255, 0.58)',
            halo: 'rgba(255, 255, 255, 0.16)',
            leftBarColorStart: '#8b0000',
            leftBarColorEnd: '#ff2f2f',
            rightBarColorStart: '#00008b',
            rightBarColorEnd: '#2d68ff',
            avatarBorder: 'rgba(255, 255, 255, 0.82)',
        },
        layout: {
            avatarSize: 0.6,
            avatarTravel: 0.12,
            titleY: 0.18,
            titleSize: 0.05,
            visualizerWidth: 0.72,
            visualizerHeight: 0.28,
            visualizerY: 0.7,
            lyricY: 0.92,
        }
    },
    {
        id: 'cinematic-lyric',
        name: 'Cinematic Lyric',
        description: 'A lyric-led composition with restrained motion and warm highlights.',
        style: 'cinematic',
        title: '电影歌词',
        theme: {
            backgroundOverlay: 'rgba(14, 8, 4, 0.58)',
            accent: '#fff4df',
            subtitle: 'rgba(255, 236, 209, 0.64)',
            halo: 'rgba(245, 175, 76, 0.22)',
            leftBarColorStart: '#463116',
            leftBarColorEnd: '#f3ab3d',
            rightBarColorStart: '#594126',
            rightBarColorEnd: '#f6d18b',
            avatarBorder: 'rgba(255, 240, 220, 0.92)',
        },
        layout: {
            avatarSize: 0.44,
            avatarTravel: 0.06,
            titleY: 0.16,
            titleSize: 0.046,
            visualizerWidth: 0.62,
            visualizerHeight: 0.12,
            visualizerY: 0.79,
            lyricY: 0.86,
        }
    },
    {
        id: 'neon-ring',
        name: 'Neon Ring',
        description: 'A club-like radial spectrum wrapped around the avatar.',
        style: 'radial',
        title: '霓虹环场',
        theme: {
            backgroundOverlay: 'rgba(2, 10, 18, 0.54)',
            accent: '#ecfeff',
            subtitle: 'rgba(184, 255, 251, 0.62)',
            halo: 'rgba(0, 255, 224, 0.24)',
            leftBarColorStart: '#0b7278',
            leftBarColorEnd: '#00ffd0',
            rightBarColorStart: '#3b1d74',
            rightBarColorEnd: '#ff5cf6',
            avatarBorder: 'rgba(228, 255, 255, 0.96)',
        },
        layout: {
            avatarSize: 0.38,
            avatarTravel: 0.08,
            titleY: 0.15,
            titleSize: 0.047,
            visualizerWidth: 0.78,
            visualizerHeight: 0.18,
            visualizerY: 0.82,
            lyricY: 0.9,
        }
    },
    {
        id: 'cosmic-particles',
        name: 'Cosmic Particles',
        description: 'A glittering particle field with bass pulses and flowing waveform ribbons.',
        style: 'cosmic',
        title: '星尘脉冲',
        theme: {
            backgroundOverlay: 'rgba(3, 5, 16, 0.6)',
            accent: '#f8fbff',
            subtitle: 'rgba(210, 226, 255, 0.68)',
            halo: 'rgba(120, 175, 255, 0.28)',
            leftBarColorStart: '#1d4ed8',
            leftBarColorEnd: '#67e8f9',
            rightBarColorStart: '#7e22ce',
            rightBarColorEnd: '#f0abfc',
            avatarBorder: 'rgba(236, 244, 255, 0.96)',
            particlePrimary: 'rgba(255, 255, 255, 0.92)',
            particleSecondary: 'rgba(125, 211, 252, 0.82)',
            pulse: 'rgba(168, 85, 247, 0.42)',
            sweep: 'rgba(255, 255, 255, 0.34)',
        },
        layout: {
            avatarSize: 0.34,
            avatarTravel: 0.05,
            titleY: 0.13,
            titleSize: 0.044,
            visualizerWidth: 0.82,
            visualizerHeight: 0.22,
            visualizerY: 0.78,
            lyricY: 0.9,
        }
    }
];

export const getScenePreset = (presetId) =>
    SCENE_PRESETS.find((preset) => preset.id === presetId) || SCENE_PRESETS[0];
