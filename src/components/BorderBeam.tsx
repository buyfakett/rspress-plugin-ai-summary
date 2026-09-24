import { useEffect, useRef } from 'react';

export interface BorderBeamProps {
    color?: string;
    size?: number;
    duration?: number;
    borderRadius?: number;
}

function traceRoundedRect(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    radius: number,
    inset: number,
) {
    const left = inset;
    const top = inset;
    const right = width - inset;
    const bottom = height - inset;

    context.moveTo(left + radius, top);
    context.lineTo(right - radius, top);
    context.arcTo(right, top, right, top + radius, radius);
    context.lineTo(right, bottom - radius);
    context.arcTo(right, bottom, right - radius, bottom, radius);
    context.lineTo(left + radius, bottom);
    context.arcTo(left, bottom, left, bottom - radius, radius);
    context.lineTo(left, top + radius);
    context.arcTo(left, top, left + radius, top, radius);
    context.closePath();
}

export function BorderBeam({
    color,
    size = 2,
    duration = 3,
    borderRadius = 16,
}: BorderBeamProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const frameRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const frame = frameRef.current;
        const context = canvas?.getContext('2d', {alpha: true});
        if (!canvas || !frame || !context) {
            return;
        }

        let width = 0;
        let height = 0;
        let resolvedBorderRadius = borderRadius;
        let animationFrame = 0;
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const themeColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--rp-c-brand')
            .trim();
        const beamColor = color || themeColor || '#ff5c35';

        const updateSize = () => {
            const rect = frame.getBoundingClientRect();
            const pixelRatio = window.devicePixelRatio || 1;
            width = Math.round(rect.width);
            height = Math.round(rect.height);
            const computedRadius = Number.parseFloat(getComputedStyle(frame).borderTopLeftRadius);
            resolvedBorderRadius = Number.isFinite(computedRadius)
                ? computedRadius
                : borderRadius;
            canvas.width = Math.max(1, Math.round(width * pixelRatio));
            canvas.height = Math.max(1, Math.round(height * pixelRatio));
            context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        };

        const draw = (timestamp: number) => {
            context.clearRect(0, 0, width, height);

            if (width > 0 && height > 0) {
                const inset = Math.max(1, size / 2);
                const radius = Math.max(
                    0,
                    Math.min(resolvedBorderRadius, (width - inset * 2) / 2, (height - inset * 2) / 2),
                );
                const horizontal = Math.max(0, width - inset * 2 - radius * 2);
                const vertical = Math.max(0, height - inset * 2 - radius * 2);
                const perimeter = 2 * horizontal + 2 * vertical + 2 * Math.PI * radius;
                const progress = reduceMotion ? 0.2 : (timestamp % (duration * 1000)) / (duration * 1000);
                const beamLength = Math.max(24, perimeter * 0.08);
                context.save();
                context.beginPath();
                traceRoundedRect(context, width, height, radius, inset);
                context.setLineDash([beamLength, Math.max(1, perimeter - beamLength)]);
                context.lineDashOffset = -progress * perimeter;
                context.lineCap = 'round';
                context.lineWidth = size;
                context.strokeStyle = beamColor;
                context.shadowColor = beamColor;
                context.shadowBlur = 8;
                context.stroke();
                context.restore();
            }

            if (!reduceMotion) {
                animationFrame = window.requestAnimationFrame(draw);
            }
        };

        const resizeObserver = typeof ResizeObserver === 'undefined'
            ? undefined
            : new ResizeObserver(updateSize);

        updateSize();
        resizeObserver?.observe(frame);
        if (!resizeObserver) {
            window.addEventListener('resize', updateSize);
        }
        animationFrame = window.requestAnimationFrame(draw);

        return () => {
            window.cancelAnimationFrame(animationFrame);
            resizeObserver?.disconnect();
            window.removeEventListener('resize', updateSize);
        };
    }, [borderRadius, color, duration, size]);

    return (
        <div ref={frameRef} className="ai-summary__beam" aria-hidden="true">
            <canvas ref={canvasRef} className="ai-summary__beam-canvas"/>
        </div>
    );
}
