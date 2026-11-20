import { useMemo } from 'react';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const point = (i, n, r, offset = -Math.PI / 2) => {
  const a = offset + (i / n) * Math.PI * 2;
  return [360 + Math.cos(a) * r, 360 + Math.sin(a) * r];
};

export default function ProgramCanvas({ data, letter, selectedProgramIdx, onLetter, onProgram }) {
  const letters = useMemo(() => ALPHABET.map((name) => ({
    name,
    programs: data.programs.filter((p) => p.name[0]?.toUpperCase() === name),
  })).filter((x) => x.programs.length), [data]);
  const group = letters.find((x) => x.name === letter);
  const programs = group?.programs || [];

  return (
    <div className="orbital-stage program-stage" aria-label="Interactive program constellation">
      <svg className="orbital-graphic" viewBox="0 0 720 720" role="group" aria-labelledby="program-graphic-title">
        <title id="program-graphic-title">{letter ? `Programs beginning with ${letter}` : 'Bug bounty program index'}</title>
        <defs>
          <radialGradient id="program-glow"><stop stopColor="var(--hot)" stopOpacity=".18" /><stop offset="1" stopColor="var(--hot)" stopOpacity="0" /></radialGradient>
          <filter id="program-grain"><feTurbulence type="fractalNoise" baseFrequency=".72" numOctaves="2" stitchTiles="stitch" /><feColorMatrix values=".25 0 0 0 .2 .25 0 0 0 .18 .25 0 0 0 .12 0 0 0 .08 0" /></filter>
        </defs>
        <circle cx="360" cy="360" r="340" fill="url(#program-glow)" opacity=".45" />
        <circle cx="360" cy="360" r="338" fill="transparent" filter="url(#program-grain)" opacity=".18" />
        {[92, 154, 218, 288, 326].map((r) => <circle key={r} className="orbit-ring" cx="360" cy="360" r={r} />)}
        {Array.from({ length: 48 }, (_, i) => {
          const [x1, y1] = point(i, 48, 92);
          const [x2, y2] = point(i, 48, 326);
          return <line key={i} className="orbit-spoke" x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
        <circle className="orbit-core" cx="360" cy="360" r="3" />
        {!letter && letters.map((item, i) => {
          const [x, y] = point(i, letters.length, 286);
          const r = 5 + Math.sqrt(item.programs.length) * 1.1;
          return <g key={item.name} className="program-hub" role="button" tabIndex="0" aria-label={`${item.name}, ${item.programs.length} programs`} onClick={() => onLetter(item.name)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onLetter(item.name)}>
            <circle className="hub-halo" cx={x} cy={y} r={r * 2.6} />
            <circle className="hub-node" cx={x} cy={y} r={r} />
            <text className="hub-label" x={x} y={y - 15}>{item.name}</text>
            <text className="hub-count" x={x} y={y + 26}>{item.programs.length}</text>
          </g>;
        })}
        {letter && programs.map((p, i) => {
          const [x, y] = point(i, programs.length, 244);
          const r = 3.5 + Math.sqrt(p.count) * 0.55;
          const active = p.index === selectedProgramIdx;
          return <g key={p.index} className={`program-hub${active ? ' active' : ''}`} role="button" tabIndex="0" aria-label={`${p.name}, ${p.count} reports`} onClick={() => onProgram(p.index)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onProgram(p.index)}>
            <line className="program-link" x1="360" y1="360" x2={x} y2={y} />
            <circle className="hub-halo" cx={x} cy={y} r={r * 3.1} />
            <circle className="hub-node" cx={x} cy={y} r={r} />
            {(programs.length < 14 || active || i % Math.ceil(programs.length / 12) === 0) && <text className="program-label" x={x} y={y < 360 ? y - 13 : y + 19} textAnchor="middle">{p.name}</text>}
          </g>;
        })}
        {letter && <g className="letter-core" onClick={() => { onLetter(''); onProgram(null); }} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (onLetter(''), onProgram(null))} role="button" tabIndex="0" aria-label="Back to all program letters"><circle cx="360" cy="360" r="65" /><text x="360" y="356">{letter}</text><text className="core-sub" x="360" y="382">{programs.length} PROGRAMS</text></g>}
      </svg>
      <div className="orbital-caption"><span className="tag">PROGRAMS / {letter || 'INDEX'}</span><p>{letter ? 'Select a program hub to trace its reports.' : 'Select a letter to open its program constellation.'}</p></div>
      {letter && <button className="orbit-back" type="button" onClick={() => { onLetter(''); onProgram(null); }}>← All programs</button>}
    </div>
  );
}
