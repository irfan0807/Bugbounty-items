import { useEffect, useRef } from 'react';

// Drifting star / particle field drawn on a canvas behind the whole page.
export default function Starfield({ enabled }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    let w = 0;
    let h = 0;
    let frame;
    let stars = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round((w * h) / 9000);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: Math.random() * 0.9 + 0.1,
        c: Math.random() > 0.85 ? '255,170,60' : '120,230,255',
      }));
    };

    const draw = (animate) => {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        if (animate) {
          s.y += s.z * 0.25;
          if (s.y > h) {
            s.y = 0;
            s.x = Math.random() * w;
          }
        }
        ctx.fillStyle = `rgba(${s.c},${0.25 + s.z * 0.6})`;
        ctx.fillRect(s.x, s.y, s.z * 1.8, s.z * 1.8);
      }
      if (animate) frame = requestAnimationFrame(() => draw(true));
    };

    resize();
    draw(enabled);
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
    };
  }, [enabled]);

  return <canvas ref={ref} className="starfield" aria-hidden="true" />;
}
