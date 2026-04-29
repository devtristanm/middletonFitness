"use client";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  forwardRef,
  useState,
  useLayoutEffect,
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

const SIG_MAX_OUTPUT_SIDE = 900;
const SIG_JPEG_QUALITY = 0.88;

/**
 * High-DPI canvases (devicePixelRatio) can produce multi‑MB PNG data URLs.
 * That exceeds typical PostgREST body limits and breaks signup. Downscale + JPEG
 * keeps a clear signature with a much smaller payload.
 */
function toCompressedSignatureDataUrl(source: HTMLCanvasElement): string {
  const w = source.width;
  const h = source.height;
  if (w < 1 || h < 1) return source.toDataURL("image/jpeg", SIG_JPEG_QUALITY);
  const maxSide = Math.max(w, h);
  const scale = Math.min(1, SIG_MAX_OUTPUT_SIDE / maxSide);
  const outW = Math.max(1, Math.round(w * scale));
  const outH = Math.max(1, Math.round(h * scale));
  const c = document.createElement("canvas");
  c.width = outW;
  c.height = outH;
  const x = c.getContext("2d");
  if (!x) return source.toDataURL("image/jpeg", SIG_JPEG_QUALITY);
  x.fillStyle = "#ffffff";
  x.fillRect(0, 0, outW, outH);
  x.imageSmoothingEnabled = true;
  x.imageSmoothingQuality = "high";
  x.drawImage(source, 0, 0, outW, outH);
  return c.toDataURL("image/jpeg", SIG_JPEG_QUALITY);
}

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
    const wrapRef = useRef<HTMLDivElement>(null);
    const drawing = useRef(false);
    const hasInk = useRef(false);
    const [size, setSize] = useState({ w: 320, h: 192 });

    useLayoutEffect(() => {
      const el = wrapRef.current;
      if (!el) return;

      const measure = () => {
        const cw = Math.floor(el.clientWidth);
        if (cw < 40) return;
        const w = cw;
        const h = Math.max(176, Math.min(280, Math.round(w * 0.33)));
        setSize((prev) =>
          prev.w === w && prev.h === h ? prev : { w, h }
        );
      };

      measure();
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      return () => ro.disconnect();
    }, []);

    const resize = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const { w, h } = size;
      const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
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
      const coarse =
        typeof window !== "undefined" &&
        window.matchMedia("(pointer: coarse)").matches;
      ctx.lineWidth = coarse ? 3.25 : 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      hasInk.current = false;
    }, [size]);

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
        return toCompressedSignatureDataUrl(canvas);
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
          <div
            ref={wrapRef}
            className="w-full min-h-[11rem] overscroll-contain sm:min-h-[12rem]"
          >
            <canvas
              ref={canvasRef}
              className="touch-none block cursor-crosshair rounded-lg border border-dashed border-surface-border bg-white"
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
          </div>
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => resize()}
              className="min-h-[44px] min-w-[44px] px-3 text-sm font-medium text-accent hover:text-accent-hover sm:min-h-0 sm:min-w-0"
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
