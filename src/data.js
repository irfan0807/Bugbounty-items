// Loads public/reports.json (built by scripts/build-data.mjs) and derives everything the UI needs.
// Report row layout: [id, programIdx, weaknessIdx, classIdx, upvotes, bounty, title, guessedFlag]

export async function loadData() {
  const res = await fetch(`${import.meta.env.BASE_URL}reports.json`);
  if (!res.ok) throw new Error(`Could not load report data (HTTP ${res.status})`);
  const raw = await res.json();

  const reports = raw.reports.map((r) => ({
    id: r[0],
    programIdx: r[1],
    program: raw.programs[r[1]],
    weaknessIdx: r[2],
    weakness: raw.weaknesses[r[2]],
    classIdx: r[3],
    upvotes: r[4],
    bounty: r[5],
    title: r[6],
    guessed: r[7] === 1,
    search: `${r[6]} ${raw.programs[r[1]]} ${raw.weaknesses[r[2]]} ${r[0]}`.toLowerCase(),
  }));

  const classes = raw.classes.map((c, i) => ({ ...c, index: i, count: 0, weaknesses: new Map() }));
  const programs = raw.programs.map((name, i) => ({ index: i, name, count: 0, bounty: 0 }));
  let totalBounty = 0;

  for (const r of reports) {
    const cls = classes[r.classIdx];
    cls.count++;
    cls.weaknesses.set(r.weaknessIdx, (cls.weaknesses.get(r.weaknessIdx) || 0) + 1);
    programs[r.programIdx].count++;
    programs[r.programIdx].bounty += r.bounty;
    totalBounty += r.bounty;
  }

  for (const cls of classes) {
    cls.weaknesses = [...cls.weaknesses.entries()]
      .map(([index, count]) => ({ index, name: raw.weaknesses[index], count }))
      .sort((a, b) => b.count - a.count);
  }

  // Biggest class first, "Other" always last.
  const sortedClasses = [...classes]
    .sort((a, b) => b.count - a.count)
    .sort((a, b) => (a.id === 'other') - (b.id === 'other'));
  const sortedPrograms = [...programs].sort((a, b) => b.count - a.count);

  return {
    reports,
    classes: sortedClasses,
    programs: sortedPrograms,
    totalBounty,
    stats: [
      { label: 'Reports', value: reports.length, prefix: '', hint: 'Public disclosures indexed' },
      { label: 'Classes', value: classes.length, prefix: '', hint: 'Vulnerability families' },
      { label: 'Weaknesses', value: raw.weaknesses.length, prefix: '', hint: 'Distinct weakness types' },
      { label: 'Programs', value: raw.programs.length, prefix: '', hint: 'Bounty programs covered' },
      { label: 'Bounties', value: totalBounty, prefix: '$', hint: 'Total paid out' },
    ],
  };
}

export const REPORT_URL = (id) => `https://hackerone.com/reports/${id}`;

export const MODULES = [
  { id: 'browse', code: 'MOD-01', title: 'Browse', text: 'Walk the map from class to weakness to individual report, one layer at a time.', cta: 'Open the map', href: '#map' },
  { id: 'programs', code: 'MOD-02', title: 'Programs', text: 'See which programs paid the most and which weaknesses were reported to them.', cta: 'View programs', href: '#programs' },
  { id: 'search', code: 'MOD-03', title: 'Search', text: 'Find any report by keyword, program, weakness or HackerOne ID.', cta: 'Search reports', href: '#search' },
  { id: 'source', code: 'MOD-04', title: 'Source', text: 'Every report links to its original public page on HackerOne.', cta: 'Read about the data', href: '#about' },
];
