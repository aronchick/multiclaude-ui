import { useRef, useEffect, useCallback } from 'react';

/**
 * Signal strength thresholds and their game-themed labels.
 * Values are 0-100 representing signal quality percentage.
 */
const SIGNAL_LABELS = [
  { min: 90, label: 'CRITICAL HIT', color: '#22c55e' },
  { min: 70, label: 'STRONG SIGNAL', color: '#84cc16' },
  { min: 50, label: 'STEADY', color: '#eab308' },
  { min: 30, label: 'WEAK SIGNAL', color: '#f97316' },
  { min: 10, label: 'LOW HP', color: '#ef4444' },
  { min: 0, label: 'FLATLINE', color: '#dc2626' },
] as const;

interface RadarDisplayProps {
  /** Signal strength value from 0-100 */
  signalStrength?: number;
  /** Size of the radar display in pixels */
  size?: number;
  /** Sweep rotation duration in seconds */
  sweepDuration?: number;
}

/**
 * RadarDisplay - A retro-styled radar visualization component.
 *
 * Features:
 * - Concentric circle grid with crosshairs
 * - Animated sweep line (clockwise rotation)
 * - Center blip that scales/pulses with signal strength
 * - Game-themed signal readout labels
 */
export function RadarDisplay({
  signalStrength = 50,
  size = 300,
  sweepDuration = 3,
}: RadarDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  // Clamp signal strength to valid range
  const clampedSignal = Math.max(0, Math.min(100, signalStrength));

  // Get the appropriate label for current signal strength
  // SIGNAL_LABELS is sorted descending by min, so find() always matches (min:0 catches all)
  const signalInfo = SIGNAL_LABELS.find((s) => clampedSignal >= s.min)!;

  // Calculate blip size based on signal strength (10-30% of radar radius)
  const blipSize = (0.1 + (clampedSignal / 100) * 0.2) * (size / 2);

  const drawRadar = useCallback((ctx: CanvasRenderingContext2D, angle: number) => {
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Background
    ctx.fillStyle = '#0a0f0a';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Grid color
    const gridColor = 'rgba(34, 197, 94, 0.3)';
    const gridColorBright = 'rgba(34, 197, 94, 0.5)';

    // Concentric circles (4 rings)
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (radius / 4) * i, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Crosshairs
    ctx.strokeStyle = gridColorBright;
    ctx.lineWidth = 1;

    // Vertical line
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius);
    ctx.lineTo(centerX, centerY + radius);
    ctx.stroke();

    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(centerX - radius, centerY);
    ctx.lineTo(centerX + radius, centerY);
    ctx.stroke();

    // Diagonal lines (45 degree angles)
    ctx.strokeStyle = gridColor;
    const diagOffset = radius * Math.cos(Math.PI / 4);

    ctx.beginPath();
    ctx.moveTo(centerX - diagOffset, centerY - diagOffset);
    ctx.lineTo(centerX + diagOffset, centerY + diagOffset);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(centerX + diagOffset, centerY - diagOffset);
    ctx.lineTo(centerX - diagOffset, centerY + diagOffset);
    ctx.stroke();

    // Sweep line with gradient trail
    const sweepLength = radius;
    const trailAngle = 0.5; // radians of trail

    // Draw sweep trail (gradient arc)
    for (let i = 0; i < 20; i++) {
      const trailOpacity = (1 - i / 20) * 0.4;
      const trailStartAngle = angle - (trailAngle * i) / 20;

      ctx.strokeStyle = `rgba(34, 197, 94, ${trailOpacity})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(trailStartAngle) * sweepLength,
        centerY + Math.sin(trailStartAngle) * sweepLength
      );
      ctx.stroke();
    }

    // Main sweep line
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.cos(angle) * sweepLength,
      centerY + Math.sin(angle) * sweepLength
    );
    ctx.stroke();

    // Outer ring glow
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

  }, [size]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const rotationProgress = (elapsed / (sweepDuration * 1000)) % 1;
      const angle = rotationProgress * Math.PI * 2 - Math.PI / 2; // Start from top

      drawRadar(ctx, angle);

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [drawRadar, sweepDuration]);

  // Blip pulse animation intensity based on signal
  const pulseIntensity = clampedSignal / 100;

  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      {/* Canvas for radar grid and sweep */}
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="absolute inset-0"
      />

      {/* Center blip overlay */}
      <div
        className="absolute rounded-full"
        style={{
          width: blipSize,
          height: blipSize,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: signalInfo.color,
          boxShadow: `0 0 ${blipSize / 2}px ${signalInfo.color}, 0 0 ${blipSize}px ${signalInfo.color}`,
          animation: `pulse ${1.5 - pulseIntensity * 0.5}s ease-in-out infinite`,
          opacity: 0.7 + pulseIntensity * 0.3,
        }}
      />

      {/* Signal readout */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center"
        style={{ fontFamily: 'monospace' }}
      >
        <div
          className="text-xs font-bold tracking-widest"
          style={{ color: signalInfo.color }}
        >
          {signalInfo.label}
        </div>
        <div
          className="text-lg font-bold"
          style={{ color: signalInfo.color }}
        >
          {Math.round(clampedSignal)}%
        </div>
      </div>

      {/* CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: ${0.7 + pulseIntensity * 0.3};
          }
          50% {
            transform: translate(-50%, -50%) scale(${1.1 + pulseIntensity * 0.2});
            opacity: ${0.9 + pulseIntensity * 0.1};
          }
        }
      `}</style>
    </div>
  );
}
