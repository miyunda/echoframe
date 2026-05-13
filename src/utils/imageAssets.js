const HEIC_MIME_TYPES = new Set([
    'image/heic',
    'image/heif',
    'image/heic-sequence',
    'image/heif-sequence',
]);

const HEIC_EXTENSIONS = ['.heic', '.heif'];

const hasHeicExtension = (name = '') => {
    const lowerName = name.toLowerCase();
    return HEIC_EXTENSIONS.some((extension) => lowerName.endsWith(extension));
};

export const isHeicLikeFile = (file) =>
    Boolean(file) && (HEIC_MIME_TYPES.has(file.type) || hasHeicExtension(file.name));

export const createAssetRecord = (file, displayName = file?.name) => ({
    type: 'image',
    file,
    url: URL.createObjectURL(file),
    name: displayName || file?.name || 'asset',
});

export const createGeneratedBackgroundAsset = (displayName = '动态背景') => ({
    type: 'generated',
    name: displayName,
});

export const assertSupportedImageFile = (file) => {
    if (isHeicLikeFile(file)) {
        throw new Error('Web 版暂不支持 HEIC/HEIF，请先用 Finder Quick Action 或其他工具转换为 PNG/JPG 后再上传。');
    }
};

export const normalizeImageFile = async (file) => {
    if (!file) return file;
    return file;
};
