export const EXPORT_PROFILE_IDS = {
    HD_720P_30: '720p30',
    FULL_HD_30: '1080p30',
    FULL_HD_60: '1080p60',
    UHD_4K_30: '4k30',
};

export const EXPORT_PROFILES = [
    {
        id: EXPORT_PROFILE_IDS.HD_720P_30,
        label: '720p30',
        description: '快速预览',
        width: 1280,
        height: 720,
        fps: 30,
        videoBitrate: 4_000_000,
        audioBitrate: 128_000,
        codec: 'avc1.64001f',
        webCodecs: false,
    },
    {
        id: EXPORT_PROFILE_IDS.FULL_HD_30,
        label: '1080p30',
        description: '推荐',
        width: 1920,
        height: 1080,
        fps: 30,
        videoBitrate: 8_000_000,
        audioBitrate: 160_000,
        codec: 'avc1.640028',
        webCodecs: true,
    },
    {
        id: EXPORT_PROFILE_IDS.FULL_HD_60,
        label: '1080p60',
        description: '高流畅',
        width: 1920,
        height: 1080,
        fps: 60,
        videoBitrate: 14_000_000,
        audioBitrate: 192_000,
        codec: 'avc1.64002a',
        webCodecs: true,
    },
    {
        id: EXPORT_PROFILE_IDS.UHD_4K_30,
        label: '4K30',
        description: '未来扩展',
        width: 3840,
        height: 2160,
        fps: 30,
        videoBitrate: 40_000_000,
        audioBitrate: 256_000,
        codec: 'avc1.640033',
        webCodecs: false,
    },
];

export const DEFAULT_EXPORT_PROFILE_ID = EXPORT_PROFILE_IDS.FULL_HD_30;

export const getExportProfile = (profileId) =>
    EXPORT_PROFILES.find((profile) => profile.id === profileId) ||
    EXPORT_PROFILES.find((profile) => profile.id === DEFAULT_EXPORT_PROFILE_ID);
