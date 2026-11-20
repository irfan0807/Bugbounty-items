import { useCountUp } from '../hooks.js';

function Stat({ stat, motion }) {
  const v = useCountUp(stat.value, motion);
  return (
    <li className="glass stat">
      <span className="stat-value">{stat.prefix}{v.toLocaleString()}</span>
      <span className="stat-label">{stat.label}</span>
      <span className="stat-hint">{stat.hint}</span>
    </li>
  );
}

export default function Hero({ motion, stats }) {
  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <div className="hero-glow" aria-hidden="true" />
      <p className="eyebrow"><i className="dot" aria-hidden="true" /> Live index online</p>
      <h1 id="hero-title">
        Every disclosed <span className="grad">bug bounty report</span>, one search away.
      </h1>
      <p className="lead">
        Browse real vulnerability reports by class, weakness and program. Tap any report and we fetch the full write-up live.
      </p>
      <div className="hero-actions">
        <a className="btn primary" href="#search">Browse reports</a>
        <a className="btn ghost" href="#map">Explore the map</a>
      </div>
      <ul className="stats" aria-label="Index statistics">
        {stats.map((s) => <Stat key={s.label} stat={s} motion={motion} />)}
      </ul>
    </section>
  );
}
