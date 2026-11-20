import { useEffect, useState } from 'react';

const DEFAULTS = { motion: true, contrast: false, text: 'md', theme: 'dark', design: 'grid' };
const KEY = 'skynet-nexus-settings';
const LEGACY_KEY = 'hexbrain-nexus-settings';

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || localStorage.getItem(LEGACY_KEY));
    const base = { ...DEFAULTS, ...(saved || {}) };
    if (!saved && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      base.motion = false;
    }
    return base;
  } catch {
    return DEFAULTS;
  }
}

// Stores accessibility preferences and mirrors them to <html> data attributes.
export function useSettings() {
  const [settings, setSettings] = useState(load);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.motion = settings.motion ? 'on' : 'off';
    root.dataset.contrast = settings.contrast ? 'high' : 'normal';
    root.dataset.text = settings.text;
    root.dataset.theme = settings.theme;
    root.dataset.design = settings.design;
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
    } catch {
      /* storage unavailable - ignore */
    }
  }, [settings]);

  const update = (patch) => setSettings((s) => ({ ...s, ...patch }));
  return [settings, update];
}

// Counts a number up once when `active` is true.
export function useCountUp(target, active, duration = 1600) {
  const [value, setValue] = useState(active ? 0 : target);

  useEffect(() => {
    if (!active) {
      setValue(target);
      return undefined;
    }
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, active, duration]);

  return value;
}
