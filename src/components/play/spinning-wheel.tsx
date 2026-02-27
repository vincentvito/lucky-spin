"use client";

import { useRef, useEffect, useCallback } from "react";

export interface WheelSegment {
  label: string;
  color: string;
}

interface SpinningWheelProps {
  segments: WheelSegment[];
  targetSegmentIndex: number | null;
  onSpinComplete: () => void;
  spinning: boolean;
}

export function SpinningWheel({
  segments,
  targetSegmentIndex,
  onSpinComplete,
  spinning,
}: SpinningWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angleRef = useRef(0);
  const animationRef = useRef<number>(0);

  const drawWheel = useCallback(
    (currentAngle: number) => {
      const canvas = canvasRef.current;
      if (!canvas || segments.length === 0) return;
      const ctx = canvas.getContext("2d")!;
      const size = canvas.width;
      const centerX = size / 2;
      const centerY = size / 2;
      const radius = centerX - 16;

      ctx.clearRect(0, 0, size, size);

      const arcSize = (2 * Math.PI) / segments.length;

      // Draw segments
      segments.forEach((segment, i) => {
        const startAngle = currentAngle + i * arcSize - Math.PI / 2;
        const endAngle = startAngle + arcSize;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = segment.color;
        ctx.fill();
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw label
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + arcSize / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `bold ${Math.max(10, Math.min(14, 280 / segments.length))}px sans-serif`;
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 2;

        // Truncate long labels
        const maxWidth = radius - 40;
        let label = segment.label;
        while (ctx.measureText(label).width > maxWidth && label.length > 3) {
          label = label.slice(0, -1);
        }
        if (label !== segment.label) label += "...";

        ctx.fillText(label, radius - 24, 5);
        ctx.shadowBlur = 0;
        ctx.restore();
      });

      // Draw center circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, 22, 0, 2 * Math.PI);
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();
      ctx.strokeStyle = "#E5E7EB";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw pointer (top, pointing down)
      ctx.beginPath();
      ctx.moveTo(centerX - 14, 4);
      ctx.lineTo(centerX + 14, 4);
      ctx.lineTo(centerX, 28);
      ctx.closePath();
      ctx.fillStyle = "#7C3AED";
      ctx.fill();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;
      ctx.stroke();
    },
    [segments]
  );

  // Spin animation
  useEffect(() => {
    if (!spinning || targetSegmentIndex === null) return;

    const arcSize = (2 * Math.PI) / segments.length;
    // Target angle: we want the target segment's center to be at the top (pointer position)
    const targetAngle = -(targetSegmentIndex * arcSize + arcSize / 2);
    // Add extra full rotations for dramatic effect
    const extraRotations = (5 + Math.floor(Math.random() * 4)) * 2 * Math.PI;
    const totalRotation = targetAngle + extraRotations - angleRef.current;

    const duration = 4500;
    const startTime = performance.now();
    const startAngle = angleRef.current;

    // Ease-out cubic for natural deceleration
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      angleRef.current = startAngle + totalRotation * easedProgress;
      drawWheel(angleRef.current);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        onSpinComplete();
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationRef.current);
  }, [spinning, targetSegmentIndex, segments, drawWheel, onSpinComplete]);

  // Initial draw
  useEffect(() => {
    drawWheel(0);
  }, [drawWheel]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={400}
      className="mx-auto max-w-full"
      style={{ maxWidth: "90vw", maxHeight: "90vw" }}
    />
  );
}
