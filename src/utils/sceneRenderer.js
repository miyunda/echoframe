import { drawLyrics, drawStereoBars } from './visualizerUtils';
import { getMotionTransform } from './backgroundTrack';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const averageBins = (data, count) => {
    const limit = Math.min(count, data.length);
    if (limit === 0) return 0;
    let total = 0;
    for (let i = 0; i < limit; i += 1) total += data[i];
    return total / limit;
};

export const createSceneRenderState = (bufferLength = 256) => ({
    barsStateLeft: Array(bufferLength).fill(0),
    barsStateRight: Array(bufferLength).fill(0),
    avatarYOffset: 0,
    recordRotation: 0,
});

export const buildFrameState = ({ time, duration, leftData, rightData, lyrics }) => {
    const safeLeftData = leftData || new Uint8Array(256);
    const safeRightData = rightData || new Uint8Array(256);
    const bassAverage = Math.max(averageBins(safeLeftData, 6), averageBins(safeRightData, 6));
    const midAverage = (averageBins(safeLeftData, 32) + averageBins(safeRightData, 32)) / 2;
    const fullAverage = (averageBins(safeLeftData, safeLeftData.length) + averageBins(safeRightData, safeRightData.length)) / 2;

    return {
        time,
        duration,
        lyrics,
        leftData: safeLeftData,
        rightData: safeRightData,
        bassEnergy: clamp(bassAverage / 255, 0, 1),
        midEnergy: clamp(midAverage / 255, 0, 1),
        energy: clamp(fullAverage / 255, 0, 1),
    };
};

const drawBackgroundImage = (ctx, width, height, image, scale, driftX = 0, driftY = 0) => {
    if (!image) return;

    const imageRatio = image.width / image.height;
    const frameRatio = width / height;

    let drawWidth;
    let drawHeight;

    if (imageRatio > frameRatio) {
        drawHeight = height * scale;
        drawWidth = drawHeight * imageRatio;
    } else {
        drawWidth = width * scale;
        drawHeight = drawWidth / imageRatio;
    }

    const x = (width - drawWidth) / 2 + driftX;
    const y = (height - drawHeight) / 2 + driftY;
    ctx.drawImage(image, x, y, drawWidth, drawHeight);
};

const drawCenterCroppedCircleImage = (ctx, image, radius) => {
    if (!image) return;

    const imageSize = Math.min(image.width, image.height);
    const sx = (image.width - imageSize) / 2;
    const sy = (image.height - imageSize) / 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(image, sx, sy, imageSize, imageSize, -radius, -radius, radius * 2, radius * 2);
    ctx.restore();
};

const drawTrackBackgroundImage = (ctx, width, height, image, motionPreset, progress, intensity = 1) => {
    if (!image) return;

    const transform = getMotionTransform(motionPreset, progress);
    const frameRatio = width / height;
    const imageRatio = image.width / image.height;

    let drawWidth;
    let drawHeight;
    if (imageRatio > frameRatio) {
        drawHeight = height * transform.scale;
        drawWidth = drawHeight * imageRatio;
    } else {
        drawWidth = width * transform.scale;
        drawHeight = drawWidth / imageRatio;
    }

    const maxOffsetX = Math.max(0, (drawWidth - width) / 2);
    const maxOffsetY = Math.max(0, (drawHeight - height) / 2);
    const x = (width - drawWidth) / 2 + transform.x * maxOffsetX * 2 * intensity;
    const y = (height - drawHeight) / 2 + transform.y * maxOffsetY * 2 * intensity;
    ctx.drawImage(image, x, y, drawWidth, drawHeight);
};

const drawGeneratedBackdrop = (ctx, width, height, preset, frameState) => {
    const baseGradient = ctx.createLinearGradient(0, 0, width, height);
    baseGradient.addColorStop(0, 'rgba(9, 18, 34, 1)');
    baseGradient.addColorStop(0.45, 'rgba(21, 41, 70, 1)');
    baseGradient.addColorStop(1, 'rgba(109, 63, 34, 1)');
    ctx.fillStyle = baseGradient;
    ctx.fillRect(0, 0, width, height);

    const pulseGlow = ctx.createRadialGradient(
        width * (0.26 + Math.sin(frameState.time * 0.11) * 0.04),
        height * (0.28 + Math.cos(frameState.time * 0.17) * 0.03),
        width * 0.04,
        width * 0.3,
        height * 0.34,
        width * (0.48 + frameState.bassEnergy * 0.08)
    );
    pulseGlow.addColorStop(0, 'rgba(92, 153, 255, 0.42)');
    pulseGlow.addColorStop(0.5, preset.theme.halo);
    pulseGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = pulseGlow;
    ctx.fillRect(0, 0, width, height);

    const warmGlow = ctx.createRadialGradient(
        width * 0.74,
        height * 0.26,
        width * 0.02,
        width * 0.74,
        height * 0.26,
        width * 0.22
    );
    warmGlow.addColorStop(0, 'rgba(255, 220, 154, 0.88)');
    warmGlow.addColorStop(0.35, 'rgba(242, 141, 73, 0.28)');
    warmGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = warmGlow;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.globalAlpha = 0.18 + frameState.midEnergy * 0.12;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i += 1) {
        const y = height * (0.62 + i * 0.06);
        ctx.beginPath();
        ctx.moveTo(width * 0.05, y);
        ctx.bezierCurveTo(
            width * 0.28,
            y - height * (0.08 + i * 0.01) + Math.sin(frameState.time * 0.8 + i) * 12,
            width * 0.62,
            y + height * (0.06 + i * 0.008) + Math.cos(frameState.time * 0.65 + i) * 12,
            width * 0.95,
            y - height * 0.01
        );
        ctx.stroke();
    }
    ctx.restore();
};

const drawBackdrop = (ctx, width, height, image, preset, frameState, assets) => {
    const { theme, style } = preset;
    const energyLift = 1 + frameState.bassEnergy * (style === 'radial' ? 0.06 : 0.035);
    const driftX = Math.sin(frameState.time * 0.18) * width * 0.012;
    const driftY = Math.cos(frameState.time * 0.14) * height * 0.01;

    if (assets?.backgroundFrame && assets?.backgroundImages?.length) {
        const { currentItem, nextItem, localProgress, nextLocalProgress, transitionProgress } = assets.backgroundFrame;
        const currentImage = assets.backgroundImages[currentItem.index];
        const nextImage = nextItem ? assets.backgroundImages[nextItem.index] : null;
        const transitionStyle = currentItem.transitionStyle || 'crossfade';

        ctx.save();
        ctx.globalAlpha = 1;
        drawTrackBackgroundImage(ctx, width, height, currentImage, currentItem.motionPreset, localProgress, energyLift);
        if (nextImage && transitionProgress > 0) {
            ctx.globalAlpha = transitionProgress;
            drawTrackBackgroundImage(ctx, width, height, nextImage, nextItem.motionPreset, nextLocalProgress, energyLift);
        }
        ctx.restore();

        if (nextImage && transitionProgress > 0 && transitionStyle === 'flash') {
            const flashStrength = Math.sin(transitionProgress * Math.PI);
            const flashGradient = ctx.createRadialGradient(
                width * 0.5,
                height * 0.42,
                width * 0.06,
                width * 0.5,
                height * 0.42,
                width * 0.7
            );
            flashGradient.addColorStop(0, `rgba(255, 250, 240, ${0.24 + flashStrength * 0.22})`);
            flashGradient.addColorStop(0.45, `rgba(255, 236, 214, ${0.14 + flashStrength * 0.12})`);
            flashGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            ctx.fillStyle = flashGradient;
            ctx.fillRect(0, 0, width, height);
            ctx.restore();
        }
    } else if (image) {
        drawBackgroundImage(ctx, width, height, image, energyLift, driftX, driftY);
    } else {
        drawGeneratedBackdrop(ctx, width, height, preset, frameState);
    }

    const topGradient = ctx.createLinearGradient(0, 0, 0, height);
    topGradient.addColorStop(0, 'rgba(0, 0, 0, 0.05)');
    topGradient.addColorStop(0.6, theme.backgroundOverlay);
    topGradient.addColorStop(1, 'rgba(0, 0, 0, 0.76)');
    ctx.fillStyle = topGradient;
    ctx.fillRect(0, 0, width, height);

    const radialGlow = ctx.createRadialGradient(
        width / 2,
        height * 0.4,
        width * 0.05,
        width / 2,
        height * 0.42,
        width * 0.55
    );
    radialGlow.addColorStop(0, theme.halo);
    radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radialGlow;
    ctx.fillRect(0, 0, width, height);
};

const drawAvatar = (ctx, width, height, avatarImage, preset, frameState, renderState) => {
    if (!avatarImage) return null;

    const size = Math.min(width, height) * preset.layout.avatarSize;
    const targetOffset = -(frameState.bassEnergy * height * preset.layout.avatarTravel);
    renderState.avatarYOffset += (targetOffset - renderState.avatarYOffset) * 0.26;

    const x = (width - size) / 2;
    const y = ((height - size) / 2) + renderState.avatarYOffset * (preset.style === 'cinematic' ? 0.65 : 1);
    const centerX = x + size / 2;
    const centerY = y + size / 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
    ctx.clip();

    const imageSize = Math.min(avatarImage.width, avatarImage.height);
    const sx = (avatarImage.width - imageSize) / 2;
    const sy = (avatarImage.height - imageSize) / 2;
    ctx.drawImage(avatarImage, sx, sy, imageSize, imageSize, x, y, size, size);
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = preset.theme.avatarBorder;
    ctx.lineWidth = Math.max(3, size * 0.008);
    ctx.shadowColor = preset.theme.halo;
    ctx.shadowBlur = size * (preset.style === 'radial' ? 0.12 : 0.04);
    ctx.beginPath();
    ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    return { x, y, size, centerX, centerY };
};

const drawVinylRecord = (ctx, width, height, preset, frameState, renderState, coverImage) => {
    const size = Math.min(width, height) * 0.38;
    const centerX = width / 2;
    const centerY = height * 0.47;
    const radius = size / 2;
    const targetOffset = -(frameState.bassEnergy * height * preset.layout.avatarTravel);
    renderState.avatarYOffset += (targetOffset - renderState.avatarYOffset) * 0.22;
    renderState.recordRotation += 0.012 + frameState.energy * 0.006;
    const yOffset = renderState.avatarYOffset * 0.5;

    ctx.save();
    ctx.translate(centerX, centerY + yOffset);
    ctx.rotate(renderState.recordRotation);

    const vinylGradient = ctx.createRadialGradient(0, 0, radius * 0.16, 0, 0, radius);
    vinylGradient.addColorStop(0, 'rgba(70, 55, 46, 1)');
    vinylGradient.addColorStop(0.3, 'rgba(24, 21, 20, 1)');
    vinylGradient.addColorStop(1, 'rgba(6, 6, 7, 1)');
    ctx.fillStyle = vinylGradient;
    ctx.shadowColor = preset.theme.vinylShadow || 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = radius * 0.22;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = preset.theme.vinylGroove || 'rgba(255, 255, 255, 0.05)';
    for (let i = 0; i < 14; i += 1) {
        const grooveRadius = radius * (0.28 + i * 0.048);
        ctx.lineWidth = i % 3 === 0 ? 1.5 : 1;
        ctx.globalAlpha = i % 2 === 0 ? 0.85 : 0.5;
        ctx.beginPath();
        ctx.arc(0, 0, grooveRadius, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;

    ctx.save();
    ctx.rotate(-renderState.recordRotation * 0.35);
    const sheen = ctx.createLinearGradient(-radius, -radius * 0.2, radius, radius * 0.28);
    sheen.addColorStop(0, 'rgba(255, 255, 255, 0)');
    sheen.addColorStop(0.42, 'rgba(255, 255, 255, 0.02)');
    sheen.addColorStop(0.5, 'rgba(255, 255, 255, 0.12)');
    sheen.addColorStop(0.58, 'rgba(255, 255, 255, 0.02)');
    sheen.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.strokeStyle = sheen;
    ctx.lineWidth = radius * 0.22;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.62, -1.05, -0.08);
    ctx.stroke();
    ctx.restore();

    const coverRadius = radius * 0.34;
    if (coverImage) {
        drawCenterCroppedCircleImage(ctx, coverImage, coverRadius);
    } else {
        const labelGradient = ctx.createLinearGradient(-coverRadius, -coverRadius, coverRadius, coverRadius);
        labelGradient.addColorStop(0, preset.theme.vinylLabel || 'rgba(255, 242, 223, 0.18)');
        labelGradient.addColorStop(1, preset.theme.halo);
        ctx.fillStyle = labelGradient;
        ctx.beginPath();
        ctx.arc(0, 0, coverRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.strokeStyle = preset.theme.avatarBorder;
    ctx.lineWidth = Math.max(3, radius * 0.025);
    ctx.beginPath();
    ctx.arc(0, 0, coverRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(12, 10, 10, 0.9)';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = preset.theme.accent;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.03, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    return {
        x: centerX - radius,
        y: centerY + yOffset - radius,
        size,
        centerX,
        centerY: centerY + yOffset,
    };
};

const drawCinematicPlate = (ctx, width, height, preset) => {
    const plateWidth = width * 0.62;
    const plateHeight = height * 0.38;
    const x = (width - plateWidth) / 2;
    const y = height * 0.18;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.strokeStyle = 'rgba(255, 235, 210, 0.12)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, plateWidth, plateHeight, 28);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
};

const hashUnit = (value) => {
    const x = Math.sin(value * 127.1) * 43758.5453;
    return x - Math.floor(x);
};

const drawLightSweep = (ctx, width, height, preset, frameState) => {
    const sweepWidth = width * (0.12 + frameState.midEnergy * 0.08);
    const travel = ((frameState.time * 0.08) % 1) * (width + sweepWidth * 2) - sweepWidth;
    const gradient = ctx.createLinearGradient(travel - sweepWidth, 0, travel + sweepWidth, height);

    gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    gradient.addColorStop(0.5, preset.theme.sweep || 'rgba(255, 255, 255, 0.24)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.32 + frameState.energy * 0.28;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(travel - sweepWidth, 0);
    ctx.lineTo(travel + sweepWidth * 0.35, 0);
    ctx.lineTo(travel + sweepWidth * 1.2, height);
    ctx.lineTo(travel - sweepWidth * 0.15, height);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
};

const drawParticleField = (ctx, width, height, preset, frameState) => {
    const count = Math.round(90 + frameState.energy * 80);

    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    for (let i = 0; i < count; i += 1) {
        const seedA = hashUnit(i + 3.17);
        const seedB = hashUnit(i + 11.73);
        const seedC = hashUnit(i + 29.91);
        const laneSpeed = 0.015 + seedC * 0.045 + frameState.midEnergy * 0.035;
        const drift = (frameState.time * laneSpeed + seedA) % 1;
        const x = ((seedB * 1.2 + Math.sin(frameState.time * 0.22 + i) * 0.018) % 1) * width;
        const y = (drift * 1.22 - 0.11) * height;
        const size = (1.1 + seedC * 2.9) * (1 + frameState.bassEnergy * 1.25);
        const twinkle = 0.42 + Math.sin(frameState.time * (1.8 + seedA * 3.4) + i) * 0.22;

        ctx.globalAlpha = Math.max(0.16, Math.min(0.86, twinkle + frameState.energy * 0.38));
        ctx.fillStyle = seedA > 0.52
            ? preset.theme.particlePrimary || 'rgba(255, 255, 255, 0.85)'
            : preset.theme.particleSecondary || preset.theme.halo;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
};

const drawBassPulse = (ctx, centerX, centerY, radius, preset, frameState) => {
    const pulseCount = 3;

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.lineWidth = Math.max(2, radius * 0.018);

    for (let i = 0; i < pulseCount; i += 1) {
        const phase = ((frameState.time * 0.32) + i / pulseCount) % 1;
        const ringRadius = radius * (1.12 + phase * (0.95 + frameState.bassEnergy * 0.45));
        const alpha = (1 - phase) * (0.12 + frameState.bassEnergy * 0.42);

        ctx.globalAlpha = alpha;
        ctx.strokeStyle = i % 2 === 0 ? preset.theme.pulse || preset.theme.halo : preset.theme.leftBarColorEnd;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = radius * 0.18;
        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.restore();
};

const drawWaveRibbon = (ctx, width, height, preset, frameState) => {
    const x = width * 0.09;
    const y = height * preset.layout.visualizerY;
    const ribbonWidth = width * preset.layout.visualizerWidth;
    const amplitude = height * preset.layout.visualizerHeight * (0.28 + frameState.energy * 0.72);
    const samples = 96;

    const drawChannel = (data, offset, colorStart, colorEnd, alpha) => {
        const gradient = ctx.createLinearGradient(x, y, x + ribbonWidth, y);
        gradient.addColorStop(0, colorStart);
        gradient.addColorStop(1, colorEnd);

        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = alpha;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = Math.max(3, width * 0.004);
        ctx.strokeStyle = gradient;
        ctx.shadowColor = colorEnd;
        ctx.shadowBlur = width * 0.018;
        ctx.beginPath();

        for (let i = 0; i < samples; i += 1) {
            const pct = i / (samples - 1);
            const bin = Math.min(data.length - 1, Math.floor(pct * data.length));
            const value = data[bin] / 255;
            const wave = Math.sin(pct * Math.PI * 4 + frameState.time * 1.6 + offset) * amplitude * 0.16;
            const px = x + pct * ribbonWidth;
            const py = y + offset + wave - value * amplitude;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }

        ctx.stroke();
        ctx.restore();
    };

    drawChannel(frameState.leftData, -height * 0.018, preset.theme.leftBarColorStart, preset.theme.leftBarColorEnd, 0.86);
    drawChannel(frameState.rightData, height * 0.026, preset.theme.rightBarColorStart, preset.theme.rightBarColorEnd, 0.76);

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.22 + frameState.bassEnergy * 0.32;
    ctx.strokeStyle = preset.theme.accent;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y + height * 0.055);
    ctx.lineTo(x + ribbonWidth, y + height * 0.055);
    ctx.stroke();
    ctx.restore();
};

const drawStereoScene = (ctx, width, height, preset, frameState, renderState) => {
    const vizWidth = width * preset.layout.visualizerWidth;
    const vizHeight = height * preset.layout.visualizerHeight;

    ctx.save();
    ctx.translate((width - vizWidth) / 2, height * preset.layout.visualizerY - vizHeight / 2);
    drawStereoBars(
        ctx,
        frameState.leftData,
        frameState.rightData,
        renderState.barsStateLeft,
        renderState.barsStateRight,
        vizWidth,
        vizHeight,
        {
            leftBarColorStart: preset.theme.leftBarColorStart,
            leftBarColorEnd: preset.theme.leftBarColorEnd,
            rightBarColorStart: preset.theme.rightBarColorStart,
            rightBarColorEnd: preset.theme.rightBarColorEnd,
            gravity: preset.style === 'cinematic' ? 1.2 : 2.4,
            gap: preset.style === 'cinematic' ? 3 : 2,
        }
    );
    ctx.restore();
};

const drawRadialBars = (ctx, avatarRect, preset, frameState) => {
    if (!avatarRect) return;

    const centerX = avatarRect.centerX;
    const centerY = avatarRect.centerY;
    const innerRadius = avatarRect.size * 0.58;
    const maxBarLength = avatarRect.size * 0.26;
    const bins = Math.min(96, frameState.leftData.length, frameState.rightData.length);

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(2, avatarRect.size * 0.012);
    ctx.shadowBlur = avatarRect.size * 0.08;

    for (let i = 0; i < bins; i += 1) {
        const channelValue = i % 2 === 0 ? frameState.leftData[i] : frameState.rightData[i];
        const value = channelValue / 255;
        const angle = (-Math.PI / 2) + (i / bins) * Math.PI * 2;
        const barLength = value * maxBarLength;
        const startRadius = innerRadius;
        const endRadius = innerRadius + barLength;

        const gradient = ctx.createLinearGradient(
            centerX + Math.cos(angle) * startRadius,
            centerY + Math.sin(angle) * startRadius,
            centerX + Math.cos(angle) * endRadius,
            centerY + Math.sin(angle) * endRadius
        );
        const colorStart = i % 2 === 0 ? preset.theme.leftBarColorStart : preset.theme.rightBarColorStart;
        const colorEnd = i % 2 === 0 ? preset.theme.leftBarColorEnd : preset.theme.rightBarColorEnd;
        gradient.addColorStop(0, colorStart);
        gradient.addColorStop(1, colorEnd);

        ctx.strokeStyle = gradient;
        ctx.shadowColor = colorEnd;
        ctx.beginPath();
        ctx.moveTo(
            centerX + Math.cos(angle) * startRadius,
            centerY + Math.sin(angle) * startRadius
        );
        ctx.lineTo(
            centerX + Math.cos(angle) * endRadius,
            centerY + Math.sin(angle) * endRadius
        );
        ctx.stroke();
    }

    ctx.restore();

    ctx.save();
    const glow = ctx.createRadialGradient(centerX, centerY, innerRadius * 0.6, centerX, centerY, innerRadius * 1.7);
    glow.addColorStop(0, 'rgba(255, 255, 255, 0)');
    glow.addColorStop(0.5, preset.theme.halo);
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius * 1.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
};

const drawCosmicScene = (ctx, width, height, preset, frameState, renderState, avatarRect) => {
    const centerX = avatarRect?.centerX ?? width / 2;
    const centerY = avatarRect?.centerY ?? height * 0.46;
    const radius = avatarRect?.size ? avatarRect.size * 0.62 : Math.min(width, height) * 0.16;

    drawParticleField(ctx, width, height, preset, frameState);
    drawLightSweep(ctx, width, height, preset, frameState);
    drawBassPulse(ctx, centerX, centerY, radius, preset, frameState);
    drawRadialBars(ctx, avatarRect || {
        centerX,
        centerY,
        size: radius * 1.45,
    }, preset, frameState);
    drawWaveRibbon(ctx, width, height, preset, frameState);

    ctx.save();
    ctx.globalAlpha = 0.58;
    ctx.translate(width * 0.13, height * 0.82);
    drawStereoBars(
        ctx,
        frameState.leftData,
        frameState.rightData,
        renderState.barsStateLeft,
        renderState.barsStateRight,
        width * 0.74,
        height * 0.065,
        {
            leftBarColorStart: preset.theme.leftBarColorStart,
            leftBarColorEnd: preset.theme.leftBarColorEnd,
            rightBarColorStart: preset.theme.rightBarColorStart,
            rightBarColorEnd: preset.theme.rightBarColorEnd,
            gravity: 1.35,
            gap: 4,
        }
    );
    ctx.restore();
};

const drawVinylScene = (ctx, width, height, preset, frameState, renderState, avatarRect) => {
    if (!avatarRect) return;

    drawRadialBars(ctx, {
        centerX: avatarRect.centerX,
        centerY: avatarRect.centerY,
        size: avatarRect.size * 1.34,
    }, preset, frameState);

    ctx.save();
    ctx.globalAlpha = 0.82;
    ctx.translate(width * 0.12, height * 0.81);
    drawStereoBars(
        ctx,
        frameState.leftData,
        frameState.rightData,
        renderState.barsStateLeft,
        renderState.barsStateRight,
        width * 0.76,
        height * 0.055,
        {
            leftBarColorStart: preset.theme.leftBarColorStart,
            leftBarColorEnd: preset.theme.leftBarColorEnd,
            rightBarColorStart: preset.theme.rightBarColorStart,
            rightBarColorEnd: preset.theme.rightBarColorEnd,
            gravity: 1.4,
            gap: 4,
        }
    );
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 244, 228, 0.28)';
    ctx.lineWidth = Math.max(3, width * 0.004);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(width * 0.72, height * 0.28);
    ctx.lineTo(width * 0.84, height * 0.4);
    ctx.lineTo(width * 0.66, height * 0.53);
    ctx.stroke();
    ctx.fillStyle = preset.theme.rightBarColorEnd;
    ctx.beginPath();
    ctx.arc(width * 0.665, height * 0.53, width * 0.012, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
};

const drawSceneDetails = (ctx, width, height, preset, frameState, renderState, avatarRect) => {
    if (preset.style === 'cinematic') {
        drawCinematicPlate(ctx, width, height, preset);
        drawStereoScene(ctx, width, height, preset, frameState, renderState);
        return;
    }

    if (preset.style === 'cosmic') {
        drawCosmicScene(ctx, width, height, preset, frameState, renderState, avatarRect);
        return;
    }

    if (preset.style === 'vinyl') {
        drawVinylScene(ctx, width, height, preset, frameState, renderState, avatarRect);
        return;
    }

    if (preset.style === 'radial') {
        drawRadialBars(ctx, avatarRect, preset, frameState);
        const baseLineHeight = height * 0.09;
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.translate(width * 0.11, height * 0.82);
        drawStereoBars(
            ctx,
            frameState.leftData,
            frameState.rightData,
            renderState.barsStateLeft,
            renderState.barsStateRight,
            width * 0.78,
            baseLineHeight,
            {
                leftBarColorStart: preset.theme.leftBarColorStart,
                leftBarColorEnd: preset.theme.leftBarColorEnd,
                rightBarColorStart: preset.theme.rightBarColorStart,
                rightBarColorEnd: preset.theme.rightBarColorEnd,
                gravity: 1.5,
                gap: 3,
            }
        );
        ctx.restore();
        return;
    }

    drawStereoScene(ctx, width, height, preset, frameState, renderState);
};

export const renderSceneFrame = ({
    ctx,
    width,
    height,
    preset,
    frameState,
    assets,
    renderState,
}) => {
    ctx.clearRect(0, 0, width, height);
    drawBackdrop(ctx, width, height, assets.backgroundImage, preset, frameState, assets);
    const avatarRect = preset.style === 'vinyl'
        ? drawVinylRecord(ctx, width, height, preset, frameState, renderState, assets.avatarImage)
        : drawAvatar(ctx, width, height, assets.avatarImage, preset, frameState, renderState);
    drawSceneDetails(ctx, width, height, preset, frameState, renderState, avatarRect);

    if (frameState.lyrics?.length) {
        drawLyrics(ctx, frameState.lyrics, frameState.time, width, height, {
            anchorY: preset.layout.lyricY,
            mainColor: preset.theme.accent,
            translationColor: preset.theme.subtitle,
            shadowColor: 'rgba(0, 0, 0, 0.58)',
        });
    }
};
