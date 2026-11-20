import { useEffect, useRef, useState } from 'react';
import TerminalEmbed from './TerminalEmbed.jsx';

export default function PracticeTerminal({ onClose }) {
  const [position, setPosition] = useState(() => ({ x: Math.max(12, window.innerWidth - 744), y: Math.max(12, window.innerHeight - 484) }));
  const [size, setSize] = useState(() => ({ width: Math.min(720, window.innerWidth - 24), height: Math.min(460, window.innerHeight - 24) }));
  const dragRef = useRef(null);

  useEffect(() => {
    const move = (event) => {
      const drag = dragRef.current;
      if (!drag) return;
      if (drag.mode === 'move') {
        setPosition({
          x: Math.max(0, Math.min(window.innerWidth - 160, event.clientX - drag.offsetX)),
          y: Math.max(0, Math.min(window.innerHeight - 100, event.clientY - drag.offsetY)),
        });
      } else {
        setSize({
          width: Math.max(320, Math.min(window.innerWidth - position.x, drag.width + event.clientX - drag.startX)),
          height: Math.max(240, Math.min(window.innerHeight - position.y, drag.height + event.clientY - drag.startY)),
        });
      }
    };
    const stop = () => { dragRef.current = null; };
    const resize = () => {
      setPosition((point) => ({ x: Math.min(point.x, Math.max(0, window.innerWidth - 240)), y: Math.min(point.y, Math.max(0, window.innerHeight - 160)) }));
      setSize((current) => ({ width: Math.min(current.width, window.innerWidth - 24), height: Math.min(current.height, window.innerHeight - 24) }));
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
      window.removeEventListener('resize', resize);
    };
  }, [position.x, position.y]);

  const startMove = (event) => {
    if (event.target.closest('button')) return;
    event.preventDefault();
    dragRef.current = { mode: 'move', offsetX: event.clientX - position.x, offsetY: event.clientY - position.y };
  };

  const startResize = (event) => {
    event.preventDefault();
    event.stopPropagation();
    dragRef.current = { mode: 'resize', startX: event.clientX, startY: event.clientY, width: size.width, height: size.height };
  };

  return (
    <section className="practice-terminal" role="dialog" aria-label="SkyNet isolated ttyd practice terminal" style={{ left: position.x, top: position.y, width: size.width, height: size.height }}>
      <header className="practice-terminal-titlebar" onPointerDown={startMove}>
        <span><i aria-hidden="true" /> SKYNET / TTYD PRACTICE TERMINAL</span>
        <div><span className="practice-terminal-status">ISOLATED LAB</span><button type="button" aria-label="Close practice terminal" onClick={onClose}>×</button></div>
      </header>
      <div className="practice-terminal-frame-wrap"><TerminalEmbed /></div>
      <button className="practice-terminal-resize" type="button" aria-label="Resize practice terminal" onPointerDown={startResize} />
    </section>
  );
}
