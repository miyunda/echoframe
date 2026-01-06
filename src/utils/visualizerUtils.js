/**
 * Pure drawing function for the visualizer.
 * Can be used for both real-time canvas and offline rendering.
 */
export const drawBars = (ctx, dataArray, barsState, width, height, options = {}) => {
    const {
        barColorStart = '#00d2ff',
        barColorEnd = '#3a7bd5',
        gravity = 1.8,
        gap = 2,
        rounding = true
    } = options;

    const bufferLength = dataArray.length;
    const barWidth = (width / bufferLength) * 2.5;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        let barHeight = (dataArray[i] / 255) * height;

        // Apply gravity
        if (barHeight < barsState[i]) {
            barsState[i] -= gravity;
        } else {
            barsState[i] = barHeight;
        }

        const drawHeight = Math.max(0, barsState[i]);
        if (drawHeight <= 0) {
            x += barWidth + 1;
            continue;
        }

        const gradient = ctx.createLinearGradient(0, height, 0, height - drawHeight);
        gradient.addColorStop(0, barColorStart);
        gradient.addColorStop(1, barColorEnd);

        ctx.fillStyle = gradient;
        const radius = barWidth / 2;

        if (rounding && drawHeight > radius) {
            ctx.beginPath();
            ctx.roundRect(x, height - drawHeight, barWidth - gap, drawHeight, [radius, radius, 0, 0]);
            ctx.fill();
        } else {
            ctx.fillRect(x, height - drawHeight, barWidth - gap, drawHeight);
        }

        x += barWidth + 1;
    }
};

/**
 * Detect bass intensity from frequency data.
 */
export const detectBass = (dataArray, threshold = 210) => {
    const bassBinCount = 5;
    let bassSum = 0;
    for (let i = 0; i < bassBinCount; i++) bassSum += dataArray[i];
    const bassAvg = bassSum / bassBinCount;
    return bassAvg > threshold;
};

/**
 * Draw stereo bars: Left channel on left half, Right channel on right half.
 */
export const drawStereoBars = (ctx, leftData, rightData, barsStateLeft, barsStateRight, width, height, options = {}) => {
    const {
        // Default "Police Light" scheme: Red (Left) / Blue (Right)
        leftBarColorStart = '#8b0000', // Dark Red
        leftBarColorEnd = '#ff0000',   // Bright Red
        rightBarColorStart = '#00008b', // Dark Blue
        rightBarColorEnd = '#0044ff',   // Bright Blue (slightly lighter for visibility)
        gravity = 1.8,
        gap = 2,
        rounding = true
    } = options;

    const bufferLength = leftData.length;
    // We have two halves. Visual width for one bar in one half.
    // Total width = width. Half width = width / 2.
    // Using ~70% of each half for bars? Or full? Let's use full half width.
    const halfWidth = width / 2;
    // Calculation: (halfWidth / bufferLength) -> width of one bar slot
    const barWidth = (halfWidth / bufferLength) * 2.5;

    // Configurable gap logic
    // If we want tight bars, maybe barWidth - 1 is okay.
    // Let's stick to the previous style: (width/bufferLength)*2.5 was for full width maybe?
    // Let's recalculate simply:
    let visualBarWidth = barWidth - gap;
    if (visualBarWidth < 0.5) visualBarWidth = 0.5;

    // Draw Left Channel (0 to width/2)
    // We usually want low freqs at the center or at the edges?
    // Standard stereo: Low freqs at Left Edge -> High freqs Center <- High freqs Center <- Low freqs Right Edge?
    // OR: Low Left -> High Center | Low Right -> High Center?
    // OR: Standard analyzer usually goes Low -> High (Left to Right).
    // Let's do:
    // Left Half: Left Data (Low -> High)
    // Right Half: Right Data (Low -> High)
    // This is the simplest "Dual Monitor" style.

    // Draw Left
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, halfWidth, height);
    ctx.clip();

    for (let i = 0; i < bufferLength; i++) {
        let barHeight = (leftData[i] / 255) * height; // Full height based? Previous was * height.

        // Gravity Left
        if (barHeight < barsStateLeft[i]) {
            barsStateLeft[i] -= gravity;
        } else {
            barsStateLeft[i] = barHeight;
        }

        const drawHeight = Math.max(0, barsStateLeft[i]);
        if (drawHeight <= 0) continue;

        const x = i * barWidth;

        const gradient = ctx.createLinearGradient(0, height, 0, height - drawHeight);
        gradient.addColorStop(0, leftBarColorStart);
        gradient.addColorStop(1, leftBarColorEnd);
        ctx.fillStyle = gradient;

        const radius = visualBarWidth / 2;
        if (rounding && drawHeight > radius) {
            ctx.beginPath();
            ctx.roundRect(x, height - drawHeight, visualBarWidth, drawHeight, [radius, radius, 0, 0]);
            ctx.fill();
        } else {
            ctx.fillRect(x, height - drawHeight, visualBarWidth, drawHeight);
        }
    }
    ctx.restore();

    // Draw Right
    ctx.save();
    ctx.beginPath();
    ctx.rect(halfWidth, 0, halfWidth, height);
    ctx.clip();

    for (let i = 0; i < bufferLength; i++) {
        let barHeight = (rightData[i] / 255) * height;

        // Gravity Right
        if (barHeight < barsStateRight[i]) {
            barsStateRight[i] -= gravity;
        } else {
            barsStateRight[i] = barHeight;
        }

        const drawHeight = Math.max(0, barsStateRight[i]);
        if (drawHeight <= 0) continue;

        // Start from middle (halfWidth)
        const x = halfWidth + (i * barWidth);

        const gradient = ctx.createLinearGradient(0, height, 0, height - drawHeight);
        gradient.addColorStop(0, rightBarColorStart);
        gradient.addColorStop(1, rightBarColorEnd);
        ctx.fillStyle = gradient;

        const radius = visualBarWidth / 2;
        if (rounding && drawHeight > radius) {
            ctx.beginPath();
            ctx.roundRect(x, height - drawHeight, visualBarWidth, drawHeight, [radius, radius, 0, 0]);
            ctx.fill();
        } else {
            ctx.fillRect(x, height - drawHeight, visualBarWidth, drawHeight);
        }
    }
    ctx.restore();
};

/**
 * Draw synchronized lyrics on the canvas.
 * @param {CanvasRenderingContext2D} ctx 
 * @param {Array} lyrics - Parsed lyrics array
 * @param {number} currentTime - Current playback time in seconds
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 */
export const drawLyrics = (ctx, lyrics, currentTime, width, height) => {
    if (!lyrics || lyrics.length === 0) return;

    // 1. Find the current lyric using robust reduce logic
    const activeIndex = lyrics.reduce((prev, curr, index) =>
        (curr.time <= currentTime) ? index : prev, -1);

    if (activeIndex === -1) return;

    const currentLyric = lyrics[activeIndex];
    const nextLyric = lyrics[activeIndex + 1];

    // Determine duration: until next lyric or default 4s
    const startTime = currentLyric.time;
    const endTime = nextLyric ? nextLyric.time : startTime + 4.0;
    const duration = endTime - startTime;
    const timeInLyric = currentTime - startTime;

    // Animation Parameters
    const fadeInDuration = 0.5;
    const fadeOutDuration = 0.5;

    let opacity = 1;
    let yOffset = 0;

    // Fade In & Slide Up
    if (timeInLyric < fadeInDuration) {
        opacity = timeInLyric / fadeInDuration;
        yOffset = (1 - opacity) * 10;
    }
    // Fade Out & Slide Up
    else if (timeInLyric > duration - fadeOutDuration) {
        opacity = (duration - timeInLyric) / fadeOutDuration;
        yOffset = -(1 - opacity) * 10;
    }
    // Steady Float
    else {
        yOffset = - (timeInLyric / duration) * 5;
    }

    opacity = Math.max(0, Math.min(1, opacity));

    if (opacity <= 0) return;

    ctx.save();


    // Position & Style
    const fontSize = Math.max(24, width / 25); // Slightly larger min size
    const x = width / 2;
    const y = height * 0.92 + yOffset; // 92% adjusted position
    const maxWidth = width * 0.85; // Max width 85% of canvas
    const lineHeight = fontSize * 1.3;

    ctx.font = `bold ${fontSize}px "Inter", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;

    ctx.globalAlpha = opacity;

    // Stroke (Black, 4-6px)
    ctx.lineJoin = 'round';
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#000000';
    ctx.fillStyle = '#ffffff';

    // Word Wrap Logic
    const words = currentLyric.text.split(' ');
    let lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);

    // Draw Lines (Stack upwards from bottom to preserve bottom margin)
    lines.forEach((line, index) => {
        // Calculate Y for this line.
        // The last line (lines.length - 1) should be at 'y'.
        // Previous lines should go up by lineHeight.
        const lineIndexFromBottom = (lines.length - 1) - index;
        const lineY = y - (lineIndexFromBottom * lineHeight);

        ctx.strokeText(line, x, lineY);
        ctx.fillText(line, x, lineY);
    });

    ctx.restore();
};
