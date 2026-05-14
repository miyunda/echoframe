import { parseLRC } from './lrcParser.js';

const TIME_RANGE_REGEX = /(\d{2}:\d{2}:\d{2}[,.:]\d{2,3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.:]\d{2,3})/;

const normalizeLineEndings = (text) => text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

const parseTimestamp = (timestamp) => {
    const match = timestamp.trim().match(/^(\d{2}):(\d{2}):(\d{2})[,.:](\d{2,3})$/);
    if (!match) return null;

    const hours = Number.parseInt(match[1], 10);
    const minutes = Number.parseInt(match[2], 10);
    const seconds = Number.parseInt(match[3], 10);
    const fraction = match[4];
    const milliseconds = Number.parseInt(fraction, 10) * (fraction.length === 2 ? 10 : 1);

    return (hours * 3600) + (minutes * 60) + seconds + (milliseconds / 1000);
};

const toCueText = (lines) => lines
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');

const parseTimedBlocks = (content) => {
    const blocks = normalizeLineEndings(content).split(/\n{2,}/);
    const cues = [];

    blocks.forEach((block) => {
        const lines = block
            .split('\n')
            .map((line) => line.trimEnd())
            .filter((line) => line.trim().length > 0);

        if (lines.length === 0) return;

        const timingLineIndex = lines.findIndex((line) => TIME_RANGE_REGEX.test(line));
        if (timingLineIndex === -1) return;

        const match = lines[timingLineIndex].match(TIME_RANGE_REGEX);
        if (!match) return;

        const startTime = parseTimestamp(match[1]);
        const endTime = parseTimestamp(match[2]);
        if (startTime === null || endTime === null || endTime <= startTime) return;

        const textLines = lines.slice(timingLineIndex + 1);
        const text = toCueText(textLines);
        if (!text) return;

        cues.push({
            time: startTime,
            startTime,
            endTime,
            text,
            translation: null,
        });
    });

    return cues.sort((a, b) => a.startTime - b.startTime);
};

export const parseSRT = (content) => parseTimedBlocks(content);

export const parseVTT = (content) => {
    const normalized = normalizeLineEndings(content)
        .replace(/^WEBVTT[^\n]*\n+/i, '')
        .replace(/^NOTE[\s\S]*?(?:\n{2,}|$)/gim, '');
    return parseTimedBlocks(normalized);
};

export const parseSubtitleByFilename = (filename, content) => {
    const extension = filename.split('.').pop()?.toLowerCase();

    if (extension === 'lrc') return parseLRC(content);
    if (extension === 'srt') return parseSRT(content);
    if (extension === 'vtt') return parseVTT(content);

    throw new Error(`暂不支持的字幕格式: .${extension || 'unknown'}`);
};
