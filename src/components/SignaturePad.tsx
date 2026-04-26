"use client";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  forwardRef,
} from "react";

export type SignaturePadHandle = {
  clear: () => void;
  isEmpty: () => boolean;
  toDataURL: () => string | null;
};

type Props = {
  className?: string;
  label?: string;
  hint?: string;
};

function getPoint(
  e: React.MouseEvent | React.TouchEvent,
  canvas: HTMLCanvasElement
) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  if ("touches" in e && e.touches[0]) {
    return {
      x: (e.touches[0].clientX - rect.left) * scaleX,
      y: (e.touches[0].clientY - rect.top) * scaleY,
    };
  }
  const me = e as React.MouseEvent;
  return {
    x: (me.clientX - rect.left) * scaleX,
    y: (me.clientY - rect.top) * scaleY,
  };
}

export const SignaturePad = forwardRef<SignaturePadHandle, Props>(
  function SignaturePad({ className = "", label, hint }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawing = useRef(false);
    const hasInk = useRef(false);

    const resize = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
      const w = 560;
      const h = 180;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#0f1419";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      hasInk.current = false;
    }, []);

    useEffect(() => {
      resize();
    }, [resize]);

    useImperativeHandle(ref, () => ({
      clear: () => {
        resize();
      },
      isEmpty: () => !hasInk.current,
      toDataURL: () => {
        const canvas = canvasRef.current;
        if (!canvas || !hasInk.current) return null;
        return canvas.toDataURL("image/png");
      },
    }));

    const start = (e: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      drawing.current = true;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const p = getPoint(e, canvas);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
    };

    const move = (e: React.MouseEvent | React.TouchEvent) => {
      if (!drawing.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const p = getPoint(e, canvas);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      hasInk.current = true;
    };

    const end = () => {
      drawing.current = false;
    };

    return (
      <div className={className}>
        {label ? (
          <p className="mb-2 text-sm font-medium text-ink">{label}</p>
        ) : null}
        <div className="rounded-xl border border-surface-border bg-white p-3 shadow-sm">
          <canvas
            ref={canvasRef}
            className="touch-none cursor-crosshair rounded-lg border border-dashed border-surface-border bg-white"
            onMouseDown={start}
            onMouseMove={move}
            onMouseUp={end}
            onMouseLeave={end}
            onTouchStart={(e) => {
              e.preventDefault();
              start(e);
            }}
            onTouchMove={(e) => {
              e.preventDefault();
              move(e);
            }}
            onTouchEnd={end}
          />
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={() => resize()}
              className="text-sm font-medium text-accent hover:text-accent-hover"
            >
              Clear signature
            </button>
          </div>
        </div>
        {hint ? (
          <p className="mt-2 text-xs text-ink-muted">{hint}</p>
        ) : null}
      </div>
    );
  }
);

SignaturePad.displayName = "SignaturePad";
