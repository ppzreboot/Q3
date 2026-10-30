import { useEffect, useRef, useState } from "react";
import { H, SAFE, SCENES, W } from "./scenes/index.js";
import { reduceMotion } from "./motion.js";
import { play } from "../sound.js";

// whole device pixels per art pixel when that costs little; the view grows to fill the box
function layout(cw, ch, dpr) {
  const dw = Math.max(1, Math.round(cw * dpr));
  const dh = Math.max(1, Math.round(ch * dpr));
  const fit = Math.min(dw / SAFE.w, dh / SAFE.h);
  let scale = Math.floor(fit);
  if (scale < 1 || scale / fit < 0.8) scale = fit;
  const vw = Math.ceil(dw / scale);
  const vh = Math.ceil(dh / scale);
  return {
    vw,
    vh,
    css: { width: (vw * scale) / dpr, height: (vh * scale) / dpr },
    left: Math.floor((dw - vw * scale) / 2) / dpr,
    top: Math.floor((dh - vh * scale) / 2) / dpr,
    ox: Math.round((vw - W) / 2),
    oy: Math.round((vh - H) / 2),
  };
}

function inside(p, r) {
  return p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h;
}

export function Stage({ id, serial, view, onPick, text }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const live = useRef({ view, onPick, text, serial, anim: {}, pointer: null, lay: null });
  const [failed, setFailed] = useState(false);

  live.current.view = view;
  live.current.onPick = onPick;
  live.current.text = text;
  if (live.current.serial !== serial) {
    live.current.serial = serial;
    live.current.anim = {};
  }

  useEffect(() => {
    const scene = SCENES[id];
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!scene || !ctx) {
      setFailed(true);
      return undefined;
    }
    const s = live.current;
    let warned = false;

    const toDesign = (event) => {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height || !s.lay) return null;
      return {
        x: ((event.clientX - r.left) / r.width) * canvas.width - s.lay.ox,
        y: ((event.clientY - r.top) / r.height) * canvas.height - s.lay.oy,
      };
    };
    const hitAt = (point) => {
      if (!point) return -1;
      const hit = scene.hits(s.view).find((rect) => inside(point, rect));
      return hit ? hit.index : -1;
    };

    const render = (now) => {
      if (!s.view || !s.lay) return;
      const { lay } = s;
      ctx.setTransform(1, 0, 0, 1, lay.ox, lay.oy);
      ctx.imageSmoothingEnabled = false;
      try {
        scene.paint(ctx, {
          view: s.view,
          anim: s.anim,
          t: s.text,
          cue: play,
          now,
          still: reduceMotion,
          hover: hitAt(s.pointer),
          canvas,
          ox: lay.ox,
          oy: lay.oy,
          vx0: -lay.ox,
          vy0: -lay.oy,
          vx1: lay.vw - lay.ox,
          vy1: lay.vh - lay.oy,
        });
      } catch (error) {
        if (!warned) console.error(error);
        warned = true;
      }
    };

    const resize = () => {
      const lay = layout(wrap.clientWidth, wrap.clientHeight, window.devicePixelRatio || 1);
      s.lay = lay;
      const changed = canvas.width !== lay.vw || canvas.height !== lay.vh;
      if (canvas.width !== lay.vw) canvas.width = lay.vw;
      if (canvas.height !== lay.vh) canvas.height = lay.vh;
      canvas.style.width = `${lay.css.width}px`;
      canvas.style.height = `${lay.css.height}px`;
      canvas.style.left = `${lay.left}px`;
      canvas.style.top = `${lay.top}px`;
      // resizing wipes the canvas; don't wait a frame to fill it again
      if (changed) render(performance.now());
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(wrap);
    window.addEventListener("resize", resize);

    const onMove = (event) => {
      s.pointer = toDesign(event);
      canvas.style.cursor = hitAt(s.pointer) >= 0 ? "pointer" : "";
    };
    const onLeave = () => {
      s.pointer = null;
      canvas.style.cursor = "";
    };
    const onDown = (event) => {
      const index = hitAt(toDesign(event));
      if (index >= 0) s.onPick?.(index);
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("pointerdown", onDown);

    let raf = 0;
    let last = 0;
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      if (now - last < 30) return;
      last = now;
      render(now);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointerdown", onDown);
    };
  }, [id]);

  return (
    <div ref={wrapRef} className="pixel-wrap">
      {failed ? <div className="stage-fallback">{text.stageFail}</div> : null}
      <canvas ref={canvasRef} className="pixel-canvas" aria-hidden="true" />
    </div>
  );
}
