import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { weaknessNotes } from '../learningContent.js';
import { CLASS_CODE_EXAMPLES, CLASS_CTF_LABS, CLASS_PAYLOAD_GUIDES, CLASS_POC_DATA, CLASS_REPO_REFERENCES, CODE_LANGUAGES, USER_REPOSITORY_RESOURCES } from '../learningExamples.js';
import { CLASS_CODE_PAIRS, CLASS_REAL_BUG_EXAMPLES } from '../learningCodePairs.js';
import ContextualTutor from './ContextualTutor.jsx';

const DEEP_DIVE = {
  xss: {
    scenario: 'A user supplied display name is saved correctly, but an administrative screen later inserts it as HTML. The stored value reaches a different viewer and a different rendering context than the original form.',
    trace: 'Trace the value from its source through storage and transformations to the exact browser context. Record whether it becomes HTML text, an attribute, a URL, CSS, or JavaScript; each context has different parsing rules.',
    review: 'Check every write and render path, including previews, admin tools, exports, and client-side DOM updates. Confirm whether the framework escapes by default and whether any raw-HTML escape hatch bypasses that protection.',
    repair: 'Keep data as text through rendering. If limited rich text is required, sanitize against a narrow allowlist and still encode values placed in attributes or URLs. Treat CSP and Trusted Types as extra containment.',
    regression: 'Add tests for each output context and for stored values viewed by another role. Include punctuation and encoded forms as inert test strings; assert they render as text and never as parsed elements.',
  },
  injection: {
    scenario: 'A search endpoint binds the search term but concatenates a caller chosen sort field into a query. Parameter binding protects values, while the structural choice remains an uncontrolled part of the query.',
    trace: 'Identify the interpreter (database, shell, template engine, directory service, or parser), the API boundary, and which input affects data versus syntax. Then verify the privileges and operations available to that interpreter.',
    review: 'Search for string-built queries, shell execution, evaluation functions, dynamic template compilation, and parser features. Review all code paths that build the same command, including background jobs.',
    repair: 'Use parameterized or structured APIs for values. Where grammar requires a field, operator, or command choice, map a small application-owned identifier to a fixed safe option; reduce the interpreter account’s privileges.',
    regression: 'Test that values containing syntax-like characters remain values, and that invalid structural choices are rejected. Include authorization checks and least privilege in the regression review.',
  },
  info: {
    scenario: 'A profile API checks that a caller is signed in but returns internal fields for any account ID. The leak is an object-level authorization failure even though the endpoint itself is authenticated.',
    trace: 'Name the protected information, its owner, intended audience, and the exact response or storage path. Determine whether the cause is missing authorization, excess fields, public caching, error output, or an exposed artifact.',
    review: 'Compare responses for synthetic accounts with different roles and ownership. Inspect API serializers, logs, error paths, backups, client bundles, cache headers, and object storage permissions.',
    repair: 'Authorize access to the specific record before reading it, return only fields needed by that caller, and remove sensitive values from public artifacts and logs. Rotate any secret that has already been exposed.',
    regression: 'Add role and ownership matrix tests that assert both allowed fields and absent fields. Verify errors and caches do not reveal data across users or tenants.',
  },
  access: {
    scenario: 'A user interface hides an administrator action, but the API accepts the same request from an ordinary account. Hiding controls changes presentation, not authorization.',
    trace: 'Identify the actor, object, requested action, and policy that should allow it. Follow the request to the server-side authorization decision and check ownership, role, tenant, and state constraints.',
    review: 'Exercise the same action as owner, peer, unrelated user, lower role, and cross-tenant user in a disposable environment. Inspect alternate APIs and background operations for consistent policy checks.',
    repair: 'Enforce deny-by-default authorization at the server boundary for every object and action. Centralize policy where possible and derive identity and tenant scope from trusted session state.',
    regression: 'Keep an authorization matrix in tests: permitted cases must succeed; peer, anonymous, lower-role, and cross-tenant cases must fail without changing state.',
  },
  auth: {
    scenario: 'A recovery link remains valid after a password change and can be replayed. The login screen may be strong while the recovery and session lifecycle still permits account takeover.',
    trace: 'Map enrollment, login, MFA, recovery, token issuance, rotation, expiry, logout, and security-event revocation. Find which proof establishes identity and how it is bound to one account and one time window.',
    review: 'Use dedicated accounts to inspect token entropy, expiry, replay, rate limits, notification, session rotation, and behavior after credential changes. Never test against another person’s account.',
    repair: 'Use well-reviewed identity flows, single-use short-lived recovery tokens, secure password hashing, and deliberate session rotation and revocation. Rate-limit sensitive transitions and alert users about recovery events.',
    regression: 'Test expiry, replay, parallel use, account binding, lockout and recovery boundaries, and revocation after password or MFA changes.',
  },
  csrf: {
    scenario: 'A browser automatically attaches a user’s session cookie to a request that changes an email address. If the server accepts the request without proving intent, a cross-site page may trigger the action.',
    trace: 'For each state-changing endpoint, determine which credentials the browser attaches automatically, what request-intent check runs, and whether the endpoint is reachable through forms or other cross-origin mechanisms.',
    review: 'Inspect token creation and validation, Origin/Referer handling, cookie SameSite settings, and APIs that use ambient cookies. Test only harmless state changes on owned accounts.',
    repair: 'Use framework CSRF protection, validate an unpredictable token or suitable origin signal, configure SameSite deliberately, and keep state changes out of GET routes.',
    regression: 'Assert that valid in-app requests succeed and requests missing or carrying invalid intent proof leave state unchanged. Test sensitive endpoints consistently, not only the first affected form.',
  },
  ssrf: {
    scenario: 'A webhook tester fetches a user-provided URL. A hostname passes validation, then redirects or resolves differently when the server connects, reaching a destination outside the intended allowlist.',
    trace: 'Follow the destination from input to URL parser, DNS resolution, connection, redirects, and response handling. Check what networks and credentials the server can reach and what fetched data is returned.',
    review: 'Use an owned callback service and inspect request metadata. Review alternate IP forms, DNS changes, redirects, schemes, ports, proxies, and time-of-check/time-of-use gaps without probing internal infrastructure.',
    repair: 'Prefer a strict destination allowlist, validate the resolved address at connection time, revalidate redirects, restrict schemes and egress, and avoid returning fetched internal responses.',
    regression: 'Test allowed destinations and controlled disallowed cases, including redirects and resolution changes, with network-level assertions that blocked ranges are never contacted.',
  },
  path: {
    scenario: 'A download handler joins a user-controlled filename to a storage directory. Encoded separators or normalization can make the resolved path differ from the string that was checked.',
    trace: 'Identify the base directory, decoding and normalization sequence, symlink behavior, and the final resolved file. For uploads, follow validation, generated names, storage permissions, and later processing.',
    review: 'Use disposable files and synthetic names. Check encoded separators, alternate separators, Unicode normalization, symlinks, archive extraction, and whether the final canonical path remains inside its allowed root.',
    repair: 'Avoid using user input as a path; map opaque IDs to server-owned names. Canonicalize once, enforce containment on the resolved path, isolate upload storage, and disable execution there.',
    regression: 'Test normal files plus traversal and normalization edge cases. Assert the resolved resource stays in the intended directory and uploaded content cannot execute or overwrite another object.',
  },
  race: {
    scenario: 'Two requests both read that a coupon is unused before either marks it redeemed. The check and update are separate, so both requests can pass the same one-time rule.',
    trace: 'Write down the invariant, identify the shared record, and locate the check and state change. Determine whether a transaction, lock, unique constraint, or atomic operation covers both.',
    review: 'Run bounded concurrent requests only in staging with synthetic records. Inspect the committed database state and audit logs; timing anomalies alone are not proof of an invariant failure.',
    repair: 'Move the invariant into an atomic transaction, conditional update, unique constraint, or lock with suitable isolation. Use idempotency keys for safe retries.',
    regression: 'Repeat parallel requests in a deterministic integration test and assert exactly one valid state transition, including retries and failure recovery.',
  },
  logic: {
    scenario: 'A discount is checked during the first step of checkout but not when the final order is committed. Changing the sequence can violate a business rule without any malformed input.',
    trace: 'State the business invariant precisely, list all transitions that can change it, then compare the server’s enforced rule with the expected rule at the final commit point.',
    review: 'Use synthetic accounts and records to test boundary values, repeated actions, alternate ordering, retries, partial failures, and concurrent updates. Confirm final state rather than relying on UI messages.',
    repair: 'Enforce business invariants on the server at the transaction boundary, make retries idempotent, and model valid state transitions explicitly.',
    regression: 'Turn each discovered rule into positive, negative, boundary, retry, and ordering tests. Assert durable state and side effects after the full workflow.',
  },
  http: {
    scenario: 'A front proxy and an application server interpret ambiguous request framing differently. A request that appears to be one message at one layer can be split at another.',
    trace: 'Map every HTTP hop, protocol version, parser, cache, and connection reuse boundary. Determine how each component normalizes headers, paths, framing, and cache keys.',
    review: 'Use a controlled staging stack and vendor-supported diagnostics. Compare normalized requests and cache behavior at each hop; avoid sending desynchronization traffic to shared or production services.',
    repair: 'Patch and align proxy/server parsers, reject ambiguous messages, normalize once at trusted boundaries, and isolate connection pools and cache keys correctly.',
    regression: 'Add protocol conformance tests across the deployed proxy chain and verify malformed or ambiguous requests are rejected consistently by every hop.',
  },
  memory: {
    scenario: 'A length calculation wraps during conversion, producing a smaller allocation than the later copy expects. The vulnerable path may be reachable only for a boundary size or platform width.',
    trace: 'Follow input size through parsing, arithmetic, conversion, allocation, indexing, and cleanup. Identify object lifetime and bounds at each operation, including asynchronous use.',
    review: 'Reproduce with a minimized local case, sanitizers, and supported compiler settings. Inspect boundary arithmetic and ownership; do not use a production crash as an impact demonstration.',
    repair: 'Prefer memory-safe abstractions, checked arithmetic, bounds-checked APIs, and clear ownership. Patch the underlying size or lifetime invariant rather than only rejecting one observed value.',
    regression: 'Keep minimized boundary cases and fuzz seeds, run sanitizers in CI, and test all supported architectures where integer width or layout affects the defect.',
  },
  crypto: {
    scenario: 'A system encrypts data but reuses a nonce or stores the key beside the ciphertext. The algorithm name alone does not establish that the complete key and protocol design is safe.',
    trace: 'Identify the security goal, data lifecycle, algorithm and mode, key generation and storage, nonce handling, authentication, rotation, and failure behavior.',
    review: 'Inspect configuration and library use against current vendor guidance. Use test keys and synthetic data; avoid collecting real secrets or inventing custom cryptographic tests.',
    repair: 'Use maintained cryptographic libraries and vetted protocols, protect and rotate keys separately from data, and authenticate ciphertext. Do not design a new primitive or protocol.',
    regression: 'Test configuration, key separation, rotation, authenticated failure behavior, and migration. Add checks that prevent weak algorithms or unsafe modes from returning in deployment settings.',
  },
  misconf: {
    scenario: 'A debug endpoint or storage bucket is exposed by a deployment setting even though application code enforces access correctly elsewhere.',
    trace: 'Compare the deployed configuration with a secure baseline across environment variables, network exposure, default credentials, headers, storage permissions, and debug features.',
    review: 'Inspect the actual environment and effective configuration, not only source defaults. Verify exposure using approved accounts and read-only checks.',
    repair: 'Use hardened defaults, infrastructure as code, least privilege, secret management, and deployment-time policy checks. Remove unused services and debug routes from production.',
    regression: 'Continuously check effective configuration in CI and deployment, including public exposure, permissions, headers, and secret presence.',
  },
  dos: {
    scenario: 'A small request triggers expensive parsing or unbounded work that consumes a shared worker pool, causing legitimate requests to queue.',
    trace: 'Measure how attacker-controlled size or complexity maps to CPU, memory, connections, queues, and downstream calls. Identify shared capacity and whether work has limits.',
    review: 'Use bounded local benchmarks or isolated staging with automatic stop thresholds. Do not run high-volume tests on production or shared services.',
    repair: 'Set size, time, recursion, concurrency, and queue limits; apply quotas, backpressure, isolation, and safe cancellation.',
    regression: 'Assert requests exceeding configured bounds fail quickly and that one expensive task cannot consume all workers or connections.',
  },
  redirect: {
    scenario: 'A post-login return parameter accepts an arbitrary destination. Users trust the starting domain, but the final browser navigation leaves the approved site.',
    trace: 'Trace the destination through decoding and URL parsing to the final Location header or client navigation. Compare parsed scheme and origin against the allowlist.',
    review: 'Use a controlled destination and cover absolute, scheme-relative, encoded, nested, and parser-confusing forms in an authorized environment.',
    repair: 'Map choices to server-defined destinations or validate the parsed origin against an explicit allowlist. Prefer relative paths and a safe fallback.',
    regression: 'Test approved local destinations and reject external origins, unusual schemes, and encoded variants after the same normalization used at runtime.',
  },
  ui: {
    scenario: 'A visual status suggests an action is complete while the server has not committed it, or a security warning is hidden at a narrow viewport. The exact security impact depends on the trust decision this interface changes.',
    trace: 'Identify the user decision influenced by the interface, the underlying server state, and whether the UI misleads, obscures, or permits a sensitive operation.',
    review: 'Compare interface states with server responses across roles, errors, keyboard use, and supported viewport sizes. Separate usability defects from security boundary failures.',
    repair: 'Make security-relevant state explicit and sourced from authoritative responses; keep server authorization independent of presentation and preserve accessible warnings and confirmations.',
    regression: 'Test loading, success, failure, permission-denied, keyboard, and narrow-screen states, and verify that UI state cannot authorize a server operation.',
  },
  other: {
    scenario: 'A report taxonomy may name an outcome, suspected issue, or broad family rather than the root cause. Several different implementation flaws can share a label.',
    trace: 'Read the source report and identify the affected asset, actor, security property, input or state transition, missing check, and demonstrated consequence before choosing a more precise CWE.',
    review: 'Separate observed evidence from reporter interpretation and program classification. If the mechanism is not established, keep the cause uncertain.',
    repair: 'Fix the demonstrated violated invariant at its enforcement point. Reclassify only when implementation evidence supports the more specific weakness.',
    regression: 'Write a regression test for the actual security property and affected transition, not merely for the report’s wording or one proof-of-concept input.',
  },
};

export default function WeaknessDetailModal({ activeClass, weakness, guide, siblings, reports, onSelect, onClose }) {
  const dialogRef = useRef(null);
  const layoutRef = useRef(null);
  const draggingDivider = useRef(false);
  const heightDragCleanup = useRef(null);
  const [listSize, setListSize] = useState(() => window.matchMedia('(max-width: 760px)').matches ? 130 : 260);
  const [chromeHeight, setChromeHeight] = useState(250);
  const [languageId, setLanguageId] = useState('javascript');
  const [exampleIndex, setExampleIndex] = useState(0);
  const [patternMode, setPatternMode] = useState('safe');
  const currentIndex = siblings.findIndex((item) => item.index === weakness.index);
  const current = currentIndex >= 0 ? currentIndex : 0;
  const playbook = DEEP_DIVE[activeClass.id] || DEEP_DIVE.other;
  const classExamples = CLASS_CODE_EXAMPLES[activeClass.id] || {};
  const availableLanguages = CODE_LANGUAGES.filter((language) => classExamples[language.id]);
  const codeExample = classExamples[languageId] || classExamples[availableLanguages[0]?.id];
  const codeOptions = CLASS_CODE_PAIRS[activeClass.id] || CLASS_CODE_PAIRS.other;
  const realBugExample = CLASS_REAL_BUG_EXAMPLES[activeClass.id] || CLASS_REAL_BUG_EXAMPLES.other;
  const selectedCodeOption = codeOptions[exampleIndex % codeOptions.length];
  const selectedSafeExample = classExamples[selectedCodeOption.language] || classExamples[availableLanguages[0]?.id];
  const ctfLab = CLASS_CTF_LABS[activeClass.id] || CLASS_CTF_LABS.other;
  const payloadGuide = CLASS_PAYLOAD_GUIDES[activeClass.id] || CLASS_PAYLOAD_GUIDES.other;
  const pocData = CLASS_POC_DATA[activeClass.id] || CLASS_POC_DATA.other;
  const repoReferences = CLASS_REPO_REFERENCES[activeClass.id] || [];
  const previous = siblings[(current - 1 + siblings.length) % siblings.length];
  const next = siblings[(current + 1) % siblings.length];

  const updateListSize = (event) => {
    const bounds = layoutRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const stacked = window.matchMedia('(max-width: 760px)').matches;
    const raw = stacked ? event.clientY - bounds.top : event.clientX - bounds.left;
    const extent = stacked ? bounds.height : bounds.width;
    const min = stacked ? 76 : 150;
    const max = Math.max(min, Math.min(stacked ? 420 : 440, extent * 0.55, extent - (stacked ? 180 : 300)));
    setListSize(Math.round(Math.min(max, Math.max(min, raw))));
  };

  const onDividerKeyDown = (event) => {
    const stacked = window.matchMedia('(max-width: 760px)').matches;
    const decrement = stacked ? ['ArrowUp', 'ArrowLeft'].includes(event.key) : event.key === 'ArrowLeft';
    const increment = stacked ? ['ArrowDown', 'ArrowRight'].includes(event.key) : event.key === 'ArrowRight';
    if (!decrement && !increment) return;
    event.preventDefault();
    setListSize((size) => Math.max(stacked ? 76 : 150, Math.min(size + (increment ? 24 : -24), stacked ? 420 : 440)));
  };

  const startChromeResize = (event) => {
    event.preventDefault();
    heightDragCleanup.current?.();
    const startY = event.clientY;
    const startHeight = chromeHeight;
    const resize = (moveEvent) => {
      const moved = moveEvent.clientY - startY;
      setChromeHeight(Math.round(Math.max(112, Math.min(250, startHeight + moved))));
    };
    const stop = () => heightDragCleanup.current?.();
    heightDragCleanup.current = () => {
      window.removeEventListener('pointermove', resize);
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
      heightDragCleanup.current = null;
    };
    window.addEventListener('pointermove', resize);
    window.addEventListener('pointerup', stop, { once: true });
    window.addEventListener('pointercancel', stop, { once: true });
  };

  const onTopResizeKeyDown = (event) => {
    if (!['ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    setChromeHeight((height) => Math.max(112, Math.min(250, height + (event.key === 'ArrowUp' ? -24 : 24))));
  };

  useEffect(() => {
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft' && previous) onSelect(previous);
      if (event.key === 'ArrowRight' && next) onSelect(next);
    };
    window.addEventListener('keydown', handleKey);
    return () => { document.body.style.overflow = oldOverflow; window.removeEventListener('keydown', handleKey); };
  }, [onClose, onSelect, next, previous]);

  useEffect(() => () => heightDragCleanup.current?.(), []);

  useEffect(() => {
    const article = dialogRef.current?.querySelector('.learn-dialog-article');
    if (article) article.scrollTop = 0;
  }, [activeClass.id, weakness.index]);

  return createPortal((
    <div className="learn-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="learn-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="weakness-dialog-title" tabIndex={-1} ref={dialogRef} style={{ '--learn-chrome-size': `${chromeHeight}px` }}>
        <div className={`learn-dialog-chrome${chromeHeight < 205 ? ' compact' : ''}`}>
        <header className="learn-dialog-header">
          <div><p className="tag">{activeClass.name.toUpperCase()} / WEAKNESS {current + 1} OF {siblings.length}</p><h2 id="weakness-dialog-title">{weakness.name}</h2><p>{weakness.count.toLocaleString('en-US')} matching reports in this collection</p></div>
          <button type="button" className="learn-dialog-close" aria-label="Close weakness details" onClick={onClose}>×</button>
        </header>
        <div className="learn-dialog-tutor">
          <ContextualTutor key={`${activeClass.id}:${weakness.index}`} subject={`${activeClass.name}: ${weakness.name}`} context={`Selected weakness label: ${weakness.name}\nMatching reports: ${weakness.count}\nLabel-specific explanation: ${weaknessNotes(weakness.name, activeClass.id)}\nClass overview: ${guide.summary}\nHow it develops: ${guide.develops}\nClass scenario: ${playbook.scenario}\nDefensive code note: ${codeExample?.note || ''}`} />
        </div>
        <div className="learn-dialog-nav" aria-label="Browse weakness types">
          <button type="button" onClick={() => onSelect(previous)} aria-label={`Previous: ${previous?.name}`}><span>← Previous</span><small>{previous?.name}</small></button>
          <button type="button" onClick={() => onSelect(next)} aria-label={`Next: ${next?.name}`}><span>Next →</span><small>{next?.name}</small></button>
        </div>
        </div>
        <div
          className="learn-dialog-height-divider"
          role="separator"
          aria-label="Drag upward to shrink the title, ChatGPT, and Previous/Next area and grow the reading area"
          aria-orientation="horizontal"
          aria-valuemin={112}
          aria-valuemax={250}
          aria-valuenow={chromeHeight}
          tabIndex={0}
          onPointerDown={startChromeResize}
          onKeyDown={onTopResizeKeyDown}
        />
        <div className="learn-dialog-layout" ref={layoutRef} style={{ '--learn-list-size': `${listSize}px` }}>
          <nav className="learn-dialog-list" aria-label={`All weakness types in ${activeClass.name}`}>
            <p className="tag">BROWSE ALL {siblings.length}</p>
            {siblings.map((item, index) => <button type="button" key={item.index} className={item.index === weakness.index ? 'active' : ''} aria-current={item.index === weakness.index ? 'true' : undefined} onClick={() => onSelect(item)}><span>{item.name}</span><small>{item.count.toLocaleString('en-US')} reports · {index + 1}</small></button>)}
          </nav>
          <div
            className="learn-dialog-divider"
            role="separator"
            aria-label="Resize weakness list and reading area"
            aria-orientation={window.matchMedia('(max-width: 760px)').matches ? 'horizontal' : 'vertical'}
            aria-valuemin={window.matchMedia('(max-width: 760px)').matches ? 76 : 150}
            aria-valuemax={window.matchMedia('(max-width: 760px)').matches ? 420 : 440}
            aria-valuenow={listSize}
            tabIndex={0}
            onPointerDown={(event) => { draggingDivider.current = true; event.currentTarget.setPointerCapture(event.pointerId); updateListSize(event); }}
            onPointerMove={(event) => { if (draggingDivider.current) updateListSize(event); }}
            onPointerUp={() => { draggingDivider.current = false; }}
            onPointerCancel={() => { draggingDivider.current = false; }}
            onKeyDown={onDividerKeyDown}
          />
          <article className="learn-dialog-article">
            <section className="learn-deep-section"><p className="tag">CLASS OVERVIEW / {activeClass.name.toUpperCase()}</p><p>{guide.summary}</p><p className="learn-detail-caveat">A report label is a starting clue, not proof of a particular root cause. Confirm the exact affected component and violated security property from implementation evidence and the source report.</p></section>
            <section className="learn-deep-section learn-selected-weakness" aria-live="polite"><p className="tag">SELECTED WEAKNESS / {current + 1} OF {siblings.length}</p><h3>{weakness.name}</h3><p>{weaknessNotes(weakness.name, activeClass.id)}</p><p className="learn-selected-count">{weakness.count.toLocaleString('en-US')} matching reports in <b>{activeClass.name}</b>. The report examples below are filtered to this selected label.</p></section>
            <section className="learn-deep-section"><h3>How the failure develops in practice</h3><p>{guide.develops}</p><p>{playbook.trace}</p><h4>Illustrative scenario</h4><p>{playbook.scenario}</p><p className="learn-detail-caveat">The scenario explains a common pattern in this class; it is not a claim about every report carrying this label.</p></section>
            <section className="learn-deep-section"><h3>Conditions and trust boundaries to examine</h3><ul>{guide.conditions.map((item) => <li key={item}>{item}</li>)}<li>{playbook.review}</li></ul><h4>Questions that narrow the root cause</h4><ol><li>What asset, account, record, or operation is meant to be protected?</li><li>Which actor can reach the affected path, and what identity or authority do they have?</li><li>Where does untrusted input or state enter, and which component makes the security decision?</li><li>What check should have stopped the behavior, and is it enforced server-side or only in the interface?</li><li>What observable effect proves a security property was violated, beyond an unusual response or error?</li></ol></section>
            <section className="learn-deep-section"><h3>Impact: follow the consequence</h3><p>{guide.impact}</p><p>Assess the affected data or action, the privileges needed, who else is affected, whether the behavior persists, and what containment already exists. Keep demonstrated impact separate from plausible worst-case outcomes.</p></section>
            <section className="learn-deep-section"><h3>How to investigate and confirm safely</h3><ul>{guide.verify.map((item) => <li key={item}>{item}</li>)}<li>{playbook.review}</li></ul><p>Use accounts, records, and systems you control. Collect the smallest evidence that shows the request, relevant authorization or state, and resulting behavior; redact secrets and unrelated user data.</p></section>
            <section className="learn-deep-section"><h3>Repair the underlying cause</h3><p>{playbook.repair}</p><ul>{guide.prevent.map((item) => <li key={item}>{item}</li>)}</ul><p>Place the control at the authoritative enforcement point, then review every alternate route that reaches the same resource or state transition. A client-side check, input filter, or one-off patch may leave equivalent paths open.</p></section>
            <section className="learn-deep-section"><h3>Regression checks to keep</h3><p>{playbook.regression}</p><ul><li>Cover a valid case, a denied case, and boundary or malformed input relevant to this exact weakness.</li><li>Assert the protected state did not change on rejection; checking only the HTTP status can miss partial side effects.</li><li>Run the check against the real service boundary and include relevant roles, tenants, retries, and deployment configuration.</li></ul></section>
            <section className="learn-code-lab" aria-labelledby="learn-code-title">
              <p className="tag">CLASS CODE EXAMPLE / REPOSITORY RESEARCH</p>
              <h3 id="learn-code-title">What this bug looks like in code</h3>
              <div className="learn-real-example">
                <div className="learn-real-example-heading"><div><span className="learn-real-example-label">{realBugExample.language} · vulnerable pattern</span><h4>{realBugExample.title}</h4></div></div>
                <p className="learn-real-example-context">{realBugExample.context}</p>
                <div className="learn-code-sample">
                  <div className="learn-code-heading"><b>{realBugExample.language} / vulnerable example</b><span>{activeClass.name}</span></div>
                  <pre><code>{realBugExample.code}</code></pre>
                  <p className="learn-code-note"><b>Why this is a bug</b>{realBugExample.why}</p>
                </div>
                <p className="learn-real-example-source">Repository reference: <a href={realBugExample.sourceUrl} target="_blank" rel="noreferrer">{realBugExample.sourceName} ↗</a></p>
                <p className="learn-detail-caveat">Repository references may be study notes, checklists, or testing scripts rather than vulnerable application code. Unless identified as a direct excerpt, this is a local app-side reproduction of the documented bug pattern—not a claim that the repository contains this exact vulnerable application.</p>
              </div>
              <details className="learn-more-code"><summary>Explore five more safe and vulnerable patterns</summary>
                <p className="learn-code-intro">Select a related pattern and compare its defensive and intentionally vulnerable forms. The vulnerable snippets are teaching fixtures only; never deploy them.</p>
                <div className="learn-example-options" role="tablist" aria-label="Choose a code example">
                  {codeOptions.map((option, index) => <button type="button" role="tab" aria-selected={index === exampleIndex} className={index === exampleIndex ? 'active' : ''} key={`${option.title}-${option.language}`} onClick={() => setExampleIndex(index)}><b>{String(index + 1).padStart(2, '0')}</b><span>{option.title}</span><small>{CODE_LANGUAGES.find((language) => language.id === option.language)?.label || option.language}</small></button>)}
                </div>
                <div className="learn-pattern-toggle" role="group" aria-label="Choose safe or unsafe pattern">
                  <button type="button" aria-pressed={patternMode === 'safe'} className={patternMode === 'safe' ? 'active' : ''} onClick={() => setPatternMode('safe')}>Safer pattern</button>
                  <button type="button" aria-pressed={patternMode === 'unsafe'} className={patternMode === 'unsafe' ? 'active' : ''} onClick={() => setPatternMode('unsafe')}>Unsafe local example</button>
                </div>
                <div className="learn-code-sample" role="tabpanel">
                  <div className="learn-code-heading"><b>{CODE_LANGUAGES.find((language) => language.id === selectedCodeOption.language)?.label || selectedCodeOption.language} / {patternMode === 'safe' ? 'safer pattern' : 'intentionally unsafe'}</b><span>{selectedCodeOption.title}</span></div>
                  <pre><code>{patternMode === 'unsafe' ? selectedCodeOption.unsafe : selectedSafeExample?.code || codeExample?.code}</code></pre>
                  <p className="learn-code-note"><b>{patternMode === 'unsafe' ? 'Why this is unsafe' : 'Why this helps'}</b>{patternMode === 'unsafe' ? selectedCodeOption.lesson : selectedSafeExample?.note || codeExample?.note}</p>
                  {patternMode === 'unsafe' && <p className="learn-detail-caveat learn-code-warning">Intentionally vulnerable teaching snippet. Run only in a disposable local lab; do not deploy or test it against a real service.</p>}
                </div>
              </details>
              <details className="learn-more-code"><summary>Explore safer examples in other languages</summary>
                <div className="learn-code-tabs" role="tablist" aria-label="Additional safer code examples">
                  {availableLanguages.map((language) => <button type="button" role="tab" aria-selected={language.id === languageId} className={language.id === languageId ? 'active' : ''} key={language.id} onClick={() => setLanguageId(language.id)}>{language.label}</button>)}
                </div>
                {codeExample && <div className="learn-code-sample" role="tabpanel">
                  <div className="learn-code-heading"><b>{CODE_LANGUAGES.find((language) => language.id === languageId)?.label} / safer pattern</b><span>{activeClass.name}</span></div>
                  <pre><code>{codeExample.code}</code></pre>
                  <p className="learn-code-note"><b>Why this helps</b>{codeExample.note}</p>
                </div>}
              </details>
              <div className="learn-ctf-lab">
                <p className="tag">LOCAL CTF / SAFE PRACTICE</p><h4>{ctfLab.title}</h4><p><b>Challenge</b>{ctfLab.objective}</p><p><b>Setup</b>{ctfLab.setup}</p><ol>{ctfLab.steps.map((step) => <li key={step}>{step}</li>)}</ol>
                <div className="learn-payload-guide"><p className="tag">PAYLOAD DESIGN / CONTROLLED INPUT</p><code>{payloadGuide.sample}</code><p>{payloadGuide.technique}</p><p><b>Expected check:</b> {payloadGuide.assertion}</p></div>
                <details><summary>Show reference code and success criteria</summary><pre><code>{ctfLab.code}</code></pre><p><b>Success looks like:</b> {ctfLab.success}</p></details>
                <p className="learn-detail-caveat">Keep this exercise local, synthetic, and within systems you own or have permission to test.</p>
              </div>
              <div className="learn-poc-card">
                <p className="tag">SAFE EXPLOIT PoC / REPORT PRACTICE</p><h4>Build a minimal proof of concept</h4>
                <p className="learn-code-intro">Use this as a controlled reproduction record: prove the security property with the smallest harmless fixture, then document what the evidence does and does not establish.</p>
                <details><summary>Open the class-specific PoC walkthrough</summary>
                  <dl className="learn-poc-fields">
                    <div><dt>Lab premise</dt><dd>{pocData.premise}</dd></div>
                    <div><dt>Controlled input</dt><dd><code>{pocData.input}</code></dd></div>
                    <div><dt>Reproduction steps</dt><dd>{pocData.procedure}</dd></div>
                    <div><dt>Evidence to capture</dt><dd>{pocData.proof}</dd></div>
                    <div><dt>Cleanup</dt><dd>{pocData.cleanup}</dd></div>
                  </dl>
                </details>
              </div>
              <div className="learn-repo-resources"><p className="tag">RELEVANT MATERIAL FROM YOUR REPOSITORIES</p>{repoReferences.map(([label, href]) => <a key={href} href={href} target="_blank" rel="noreferrer"><b>{label} ↗</b><small>Reference used for this class’s learning path.</small></a>)}<p className="tag learn-repo-more">MORE REPOSITORIES</p>{USER_REPOSITORY_RESOURCES.map((resource) => <a key={resource.href} href={resource.href} target="_blank" rel="noreferrer"><b>{resource.name} ↗</b><small>{resource.note}</small></a>)}</div>
            </section>
            <section className="learn-deep-section"><h3>Evidence and report quality</h3><p>Document the affected endpoint or component, account role, prerequisites, minimal reproduction sequence, expected security rule, observed result, and practical impact. Explain uncertainty, avoid including other users’ data, and link the issue to its likely root cause only when evidence supports it.</p></section>
            {reports.length > 0 && <section className="learn-deep-section"><h3>Related public reports in this collection</h3><ul className="learn-dialog-reports">{reports.slice(0, 4).map((report) => <li key={report.id}><a href={`https://hackerone.com/reports/${report.id}`} target="_blank" rel="noreferrer">{report.title || 'Untitled report'} <span>↗</span></a><small>{report.program} · {report.weakness}</small></li>)}</ul></section>}
            <section className="learn-deep-section"><h3>Continue learning</h3><div className="learn-dialog-refs">{guide.refs.map(([label, href]) => <a key={href} href={href} target="_blank" rel="noreferrer">{label} ↗</a>)}</div></section>
          </article>
        </div>
        <footer className="learn-dialog-footer"><span>Drag below Previous/Next upward to compress the top area · drag divider for panes · bottom-right corner to resize</span><button type="button" onClick={onClose}>Close details</button></footer>
      </section>
    </div>
  ), document.body);
}
