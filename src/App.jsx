import { useEffect, useState } from 'react';
import Starfield from './components/Starfield.jsx';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import ClassMap from './components/ClassMap.jsx';
import Programs from './components/Programs.jsx';
import Search from './components/Search.jsx';
import DesignGallery from './components/DesignGallery.jsx';
import { Modules, About, Footer } from './components/Sections.jsx';
import { useSettings } from './hooks.js';
import { loadData } from './data.js';

const EMPTY_FILTERS = { query: '', classIdx: 'all', weaknessIdx: 'all', programIdx: 'all', sort: 'upvotes' };

export default function App() {
  const [settings, update] = useSettings();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  useEffect(() => {
    loadData().then(setData).catch((e) => setError(e.message));
  }, []);

  const applyFilters = (patch) => {
    setFilters({ ...EMPTY_FILTERS, ...patch });
    requestAnimationFrame(() =>
      document.getElementById('search')?.scrollIntoView({ behavior: settings.motion ? 'smooth' : 'auto' })
    );
  };

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <Starfield enabled={settings.motion} />
      <div className="scanlines" aria-hidden="true" />
      <Header settings={settings} update={update} />
      <main id="main">
        {error && <div className="panel empty" role="alert">Data failed to load: {error}. Run <code>node scripts/build-data.mjs</code> first.</div>}
        {!data && !error && <div className="panel empty" role="status">Loading 15,000+ reports...</div>}
        {data && (
          <>
            <Hero motion={settings.motion} stats={data.stats} />
            <ClassMap data={data} onPick={(classIdx, weaknessIdx = 'all') => applyFilters({ classIdx, weaknessIdx })} />
            <Programs data={data} onPick={(programIdx) => applyFilters({ programIdx })} />
            <Search data={data} filters={filters} setFilters={setFilters} />
            <Modules />
            <About data={data} />
            <DesignGallery data={data} settings={settings} update={update} />
          </>
        )}
      </main>
      <Footer />
    </>
  );
}

