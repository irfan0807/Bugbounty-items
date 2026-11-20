const WSTG = 'https://owasp.org/www-project-web-security-testing-guide/';
const CWE = 'https://cwe.mitre.org/data/definitions.html';

export const CLASS_GUIDES = {
  xss: {
    title: 'Cross-site scripting',
    summary: 'Untrusted data reaches a browser parsing context as executable markup or script instead of remaining ordinary text.',
    develops: 'A value enters through a form, URL, stored profile, API response, or another source. The application later inserts it into HTML, an attribute, a URL, CSS, or JavaScript without encoding for that exact context. The browser parses the resulting document and interprets part of the value as code. Reflected, stored, and DOM-based XSS describe where the value travels and when the unsafe interpretation happens.',
    conditions: ['An attacker can influence data that another user or the same user will view.', 'The value reaches an executable browser context through a template, unsafe DOM sink, or custom rendering code.', 'The output context is not protected by context-aware encoding or an appropriate sanitizer.'],
    impact: 'Depending on the affected origin and browser controls, script running in a trusted page can read page data, alter the interface, or perform actions with the viewer’s current access. The likely impact depends on the application’s data and authorization design.',
    verify: ['Use a local test account and harmless marker text; trace it from the input to the rendered output.', 'Check whether the value is inserted as text or parsed as markup in the specific HTML, attribute, URL, CSS, or script context.', 'For DOM paths, trace sources such as location or postMessage to sinks such as innerHTML; do not test against users or third-party systems.'],
    prevent: ['Prefer framework templating and safe text APIs that encode output by default.', 'Encode at the output boundary for the exact browser context; sanitize only when users are intentionally allowed to author limited HTML.', 'Avoid unsafe HTML insertion and string-built script. Add a restrictive Content Security Policy and Trusted Types as additional controls, not replacements for safe rendering.'],
    refs: [['OWASP XSS Prevention Cheat Sheet', 'https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html'], ['OWASP Web Security Testing Guide', WSTG], ['MITRE CWE', CWE]],
  },
  csrf: {
    title: 'Cross-site request forgery', summary: 'A browser is induced to send an unwanted state-changing request while carrying credentials that the target site accepts automatically.',
    develops: 'The application relies on ambient browser credentials, usually cookies, and accepts a state-changing request without confirming that it came from an interaction initiated by the application. A separate site can cause a victim’s browser to send a request; the browser may attach the target’s cookies automatically.',
    conditions: ['A victim is authenticated in the target application.', 'The browser automatically attaches credentials to the relevant request.', 'The endpoint changes state without an effective request-intent check.'],
    impact: 'An unwanted action can be performed with the victim’s existing permissions. The effect is limited by which endpoint is vulnerable and what the victim can do.',
    verify: ['Use a dedicated test account and a non-destructive state change in an authorized environment.', 'Review whether every state-changing route validates an unpredictable CSRF token or another suitable request-origin signal.', 'Check cookie SameSite behavior as defense in depth; do not assume it protects every client or request flow.'],
    prevent: ['Use framework CSRF defenses and unpredictable per-session or per-request tokens where appropriate.', 'Validate Origin or Referer as a supplementary control and configure SameSite cookies deliberately.', 'Keep state changes out of GET requests and protect APIs according to their authentication model.'],
    refs: [['OWASP CSRF Prevention Cheat Sheet', 'https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html'], ['OWASP Web Security Testing Guide', WSTG], ['MITRE CWE', CWE]],
  },
  ssrf: {
    title: 'Server-side request forgery', summary: 'The server makes a network request using a destination influenced by a user or another untrusted source.',
    develops: 'A feature accepts a URL, hostname, webhook, import location, image address, or similar value and asks a server-side component to fetch it. If destination validation and network egress controls are weak, the server may reach resources that the user cannot access directly. Redirects and DNS changes can complicate checks.',
    conditions: ['A server-side component fetches or connects to a destination influenced by untrusted input.', 'Destination checks can be bypassed or are missing.', 'The server has network reachability or credentials that increase the consequences.'],
    impact: 'The server may disclose response data, trigger internal actions, or reach internal services. Actual impact depends on network segmentation, identity, response handling, and the reachable services.',
    verify: ['Use an owned test service and a controlled callback endpoint; record only the request metadata needed to confirm server-side fetching.', 'Inspect redirect handling, DNS resolution, IP-range checks, protocol restrictions, and response exposure.', 'Do not probe cloud metadata, internal hosts, or networks outside your written authorization.'],
    prevent: ['Prefer a strict allowlist of required destinations over blocklists.', 'Resolve and validate addresses at connection time, re-check redirects, restrict protocols, and defend against DNS rebinding.', 'Use network egress controls and avoid returning fetched internal responses to users.'],
    refs: [['OWASP SSRF Prevention Cheat Sheet', 'https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html'], ['OWASP WSTG: SSRF', 'https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Input_Validation_Testing/19-Testing_for_Server_Side_Request_Forgery'], ['MITRE CWE', CWE]],
  },
  redirect: {
    title: 'Open redirect', summary: 'A redirect destination is controlled by input that the application does not validate against an approved destination policy.',
    develops: 'The application reads a return URL, next-page value, or redirect parameter and sends the browser there after login or another action. Trusting a complete user-supplied destination can make a trusted application link lead to an attacker-controlled site.',
    conditions: ['A redirect target is derived from an untrusted value.', 'Validation accepts arbitrary hosts or relies on incomplete string matching.', 'A user is likely to trust the link because it begins at a legitimate domain.'],
    impact: 'The flaw can support phishing and may weaken flows that rely on trusted redirect destinations. It does not by itself grant access to the destination application.',
    verify: ['In an authorized test, use a controlled destination and confirm whether the application navigates away from its approved hosts.', 'Review absolute URLs, scheme-relative forms, encoded input, nested redirects, and parser differences.', 'Check login, logout, invite, and OAuth return paths separately.'],
    prevent: ['Map user choices to server-defined destination identifiers or an explicit allowlist.', 'Prefer relative paths and validate the parsed origin, scheme, and path rather than a substring.', 'Use a safe default destination when validation fails.'],
    refs: [['OWASP Unvalidated Redirects and Forwards', 'https://owasp.org/www-community/attacks/Unvalidated_Redirects_and_Forwards'], ['OWASP Web Security Testing Guide', WSTG], ['MITRE CWE', CWE]],
  },
  race: {
    title: 'Race conditions', summary: 'The result of an operation changes when concurrent requests interleave around a shared state or invariant.',
    develops: 'Code checks a condition and updates state in separate operations. Two requests can both observe the old state before either update becomes visible. If the check and update are not atomic, concurrency can violate limits, ownership rules, or one-time-use expectations.',
    conditions: ['Multiple requests can act on shared state at the same time.', 'A security-sensitive check and its state change are not atomic or serialized.', 'The application assumes a request sequence that concurrent clients can violate.'],
    impact: 'Possible outcomes include duplicate transactions, limit bypass, inconsistent state, or repeated use of a one-time action. Assess the business invariant and resulting state, not timing alone.',
    verify: ['Use an authorized staging environment and synthetic records.', 'Repeat the same valid operation concurrently and inspect whether the invariant remains true.', 'Confirm findings with server-side logs or database state; avoid testing against live payments or other real effects.'],
    prevent: ['Enforce invariants in a database transaction, unique constraint, atomic compare-and-set, or appropriate lock.', 'Use idempotency keys for retried operations and model one-time transitions explicitly.', 'Test concurrency at the service and storage boundary.'],
    refs: [['MITRE CWE: TOCTOU', 'https://cwe.mitre.org/data/definitions/367.html'], ['OWASP Web Security Testing Guide', WSTG], ['MITRE CWE', CWE]],
  },
  memory: {
    title: 'Memory safety', summary: 'A program uses memory outside the bounds, lifetime, or type rules intended by its design.',
    develops: 'Low-level code calculates sizes, indexes buffers, or manages object lifetimes. Incorrect bounds, integer conversion, ownership, or cleanup can leave a read or write pointing outside valid memory or at an object that is no longer valid.',
    conditions: ['Input or internal state can influence a memory size, index, pointer, or lifetime.', 'The implementation language or unsafe boundary permits invalid memory operations.', 'The bad state is reachable in a production build.'],
    impact: 'Depending on platform and mitigations, memory safety defects can crash a process, expose memory, corrupt data, or in some cases affect control flow.',
    verify: ['Reproduce with a minimized test case in an isolated build using sanitizers or memory-safe diagnostics.', 'Review integer conversions, allocation sizes, bounds, ownership, and cleanup paths.', 'Do not fuzz production systems or use a crash as proof of remote control.'],
    prevent: ['Prefer memory-safe languages and safe abstractions for new code.', 'Use bounds-checked APIs, explicit ownership, and checked size arithmetic.', 'Run sanitizers, fuzzing, static analysis, and regression tests on supported builds.'],
    refs: [['MITRE CWE Top 25', 'https://cwe.mitre.org/top25/'], ['OWASP Web Security Testing Guide', WSTG], ['MITRE CWE', CWE]],
  },
  injection: {
    title: 'Injection', summary: 'Untrusted data is interpreted as part of a command, query, expression, or document structure.',
    develops: 'An application combines data and an interpreter’s syntax in one string or object. The interpreter cannot distinguish the intended value from control syntax, so the input changes the operation being performed. SQL, command, LDAP, XPath, template, and XML injections share this boundary failure but need different defenses.',
    conditions: ['Untrusted data reaches an interpreter or parser.', 'The application builds syntax by concatenating values or exposes an unsafe evaluation feature.', 'The chosen API does not preserve the data/control boundary.'],
    impact: 'Impact varies by interpreter and service privileges: altered queries, access to unintended records, server-side actions, or resource use.',
    verify: ['Trace the value into the query or interpreter call in code or a controlled environment.', 'Use safe test data and read-only checks where possible; confirm whether values remain data rather than changing syntax.', 'Review logs and query plans without dumping private records or executing destructive operations.'],
    prevent: ['Use parameterized queries, structured APIs, and safe interpreter bindings.', 'For syntax positions that cannot be bound, select from fixed application-owned allowlists.', 'Limit service privileges and remove unnecessary evaluation features; validation and escaping alone are not universal defenses.'],
    refs: [['OWASP Injection Prevention Cheat Sheet', 'https://cheatsheetseries.owasp.org/cheatsheets/Injection_Prevention_Cheat_Sheet.html'], ['OWASP SQL Injection Prevention Cheat Sheet', 'https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html'], ['MITRE CWE', CWE]],
  },
  info: {
    title: 'Information disclosure', summary: 'Sensitive information becomes available to a person, process, or audience that should not receive it.',
    develops: 'A response, error, file, log, cache, or public endpoint contains more information than the caller needs. The data may be exposed directly, through a missing authorization check, or through debugging and deployment artifacts.',
    conditions: ['Sensitive data exists in a response path or stored artifact.', 'The application fails to minimize, authorize, redact, or protect it.', 'An untrusted user can reach the affected path or storage.'],
    impact: 'Exposure can enable privacy loss, credential compromise, account targeting, or further attacks. Impact depends on the data sensitivity, audience, and retention.',
    verify: ['Use test accounts with different roles and compare only the fields and records each role should see.', 'Inspect error handling, headers, cache behavior, public storage, and log access.', 'Redact or hash sensitive values in evidence; do not retrieve unrelated user data.'],
    prevent: ['Return only fields needed by the caller and enforce authorization before data access.', 'Keep secrets out of source control, client bundles, errors, and logs; rotate exposed credentials.', 'Use access controls, retention limits, encryption where appropriate, and safe error responses.'],
    refs: [['OWASP Web Security Testing Guide', WSTG], ['MITRE CWE Top 25', 'https://cwe.mitre.org/top25/'], ['MITRE CWE', CWE]],
  },
  auth: {
    title: 'Authentication and sessions', summary: 'The application incorrectly establishes, verifies, or maintains a user’s identity.',
    develops: 'Identity flows span login, recovery, MFA, session creation, renewal, and logout. A weak check, reusable recovery token, inconsistent identity binding, or session that survives a security event can let an account be accessed or retained by the wrong party.',
    conditions: ['An identity proof or session transition is weaker than the application’s trust decision requires.', 'A token, credential, or recovery process is guessable, reusable, leaked, or insufficiently bound.', 'Sensitive actions fail to re-check identity when needed.'],
    impact: 'An attacker may access or retain another account, impersonate a user, or bypass a security step. The scope depends on account privileges and the affected flow.',
    verify: ['Use dedicated test accounts and review the full lifecycle: enroll, authenticate, recover, rotate, expire, and revoke.', 'Check rate limits, MFA binding, session rotation after privilege changes, and logout invalidation.', 'Never test password spraying or real users; use synthetic credentials and provider sandbox modes.'],
    prevent: ['Use established identity libraries, strong password hashing, MFA, and risk-appropriate reauthentication.', 'Make recovery tokens short-lived, single-use, unpredictable, and tied to the intended account.', 'Rotate sessions after authentication and privilege changes; use Secure, HttpOnly, and appropriate SameSite cookies.'],
    refs: [['OWASP Authentication Cheat Sheet', 'https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html'], ['OWASP Session Management Cheat Sheet', 'https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html'], ['OWASP WSTG', WSTG]],
  },
  access: {
    title: 'Authorization and access control', summary: 'A user can perform an action or access an object outside the permissions granted by the application.',
    develops: 'The server trusts a client-supplied object identifier, role, or route selection, or checks access only in the interface. A missing or inconsistent server-side policy allows requests to cross user, tenant, role, or ownership boundaries.',
    conditions: ['The request identifies an object, action, tenant, or role.', 'The server does not evaluate the current subject’s permission for that exact action and object.', 'The object or operation is reachable through an API or alternate route.'],
    impact: 'Data can be read or changed across account boundaries, or privileged actions can be performed without the required role.',
    verify: ['Use two test accounts and synthetic records; compare owner and non-owner access for read and write operations.', 'Check direct API calls as well as UI controls, alternate methods, batch routes, and exports.', 'Confirm denied actions remain denied server-side and do not alter state.'],
    prevent: ['Authorize every request on the server using the authenticated subject, object, and action.', 'Default to deny, centralize policy checks, and test tenant isolation and object ownership.', 'Treat identifiers and hidden controls as untrusted; use least privilege and audit sensitive decisions.'],
    refs: [['OWASP Authorization Cheat Sheet', 'https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html'], ['OWASP WSTG', WSTG], ['MITRE CWE', CWE]],
  },
  path: {
    title: 'File handling and path traversal', summary: 'Untrusted input affects which file or directory an application reads, writes, serves, or processes.',
    develops: 'A filename, archive member, or path fragment is joined with a trusted directory. Validation may happen before decoding or normalization, or different layers may resolve the path differently. Upload and download flows can also trust extensions or content metadata.',
    conditions: ['Untrusted input influences a filesystem path or file-processing operation.', 'Canonicalization, containment, or content validation is incomplete.', 'The service account can access files beyond the intended area.'],
    impact: 'The application may expose or overwrite unintended files, place content in an executable location, or process dangerous content.',
    verify: ['Use a temporary directory and synthetic files in an isolated environment.', 'Trace decoding, normalization, path joining, symlink behavior, archive extraction, and permission checks.', 'Confirm a candidate path resolves inside the intended root without reading real secrets.'],
    prevent: ['Map user-facing identifiers to server-owned filenames instead of accepting paths.', 'Canonicalize once, verify the resolved path remains inside a fixed root, and use restrictive filesystem permissions.', 'Validate uploaded content with safe parsers, store outside executable web roots, and set limits.'],
    refs: [['OWASP File Upload Cheat Sheet', 'https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html'], ['OWASP WSTG', WSTG], ['MITRE CWE', CWE]],
  },
  http: {
    title: 'HTTP protocol abuse', summary: 'Different components interpret an HTTP message, header, cache key, or URL differently.',
    develops: 'A request passes through clients, proxies, gateways, caches, and application servers. Ambiguous framing, normalization differences, or conflicting header interpretation can make those components disagree about where one request ends or which resource it identifies.',
    conditions: ['A request crosses multiple HTTP-processing layers.', 'Those layers normalize or parse the same input differently.', 'The discrepancy affects routing, caching, authorization, or connection reuse.'],
    impact: 'Depending on the component chain, a discrepancy can cause request confusion, cache errors, routing mistakes, or security checks to apply to a different request than intended.',
    verify: ['Test only in a controlled staging environment with a dedicated client and server-side logs.', 'Compare edge and origin interpretation for canonical requests; avoid sending ambiguous requests to shared production infrastructure.', 'Confirm the affected component versions and deployment topology.'],
    prevent: ['Use consistent, patched HTTP components and reject ambiguous or conflicting message framing.', 'Normalize once at a trusted boundary and apply authorization and cache policy to the normalized request.', 'Separate tenants and connections where shared proxy behavior can leak data.'],
    refs: [['OWASP Web Security Testing Guide', WSTG], ['OWASP Cheat Sheet Series', 'https://cheatsheetseries.owasp.org/'], ['MITRE CWE', CWE]],
  },
  ui: {
    title: 'UI redress and phishing', summary: 'A user is misled about the origin, destination, or meaning of a visible interaction.',
    develops: 'The interface permits unsafe framing, misleading navigation, weak origin cues, or content that visually imitates trusted controls. The user performs an action under a false impression of where it will take effect.',
    conditions: ['A user interaction can be embedded, obscured, or visually misrepresented.', 'The browser or application does not communicate the true origin or action clearly.', 'The action has meaningful consequences.'],
    impact: 'Users can be tricked into unintended actions, sharing information, or trusting a fraudulent flow.',
    verify: ['Use a test page and account to review framing and navigation behavior.', 'Check frame-ancestors or X-Frame-Options policy and inspect externally supplied content and links.', 'Do not impersonate real services or collect credentials during testing.'],
    prevent: ['Set a restrictive frame policy and use anti-clickjacking controls appropriate to the application.', 'Make origin and destination clear, use safe external-link handling, and require confirmation for high-impact actions.', 'Train support workflows to verify identity through trusted channels.'],
    refs: [['OWASP Clickjacking', 'https://owasp.org/www-community/attacks/Clickjacking'], ['OWASP WSTG', WSTG], ['MITRE CWE', CWE]],
  },
  crypto: {
    title: 'Cryptography and secrets', summary: 'Sensitive values or cryptographic operations are handled in ways that expose data or weaken its authenticity and confidentiality.',
    develops: 'Teams select primitives, key storage, randomness, protocol settings, or secret lifetimes. Custom algorithms, outdated parameters, hard-coded secrets, reused nonces, or missing certificate validation can undermine otherwise secure systems.',
    conditions: ['Sensitive data depends on cryptography or a secret for protection.', 'The implementation, configuration, or lifecycle is incorrect.', 'An attacker can access the weak code path, key, or communication channel.'],
    impact: 'Data may be disclosed, forged, or accepted from an untrusted party. The exact impact depends on the primitive, key exposure, protocol, and data protected.',
    verify: ['Inventory algorithms, key sizes, certificates, randomness sources, and key rotation practices.', 'Use approved test suites and configuration scanners; do not attempt to recover real user secrets.', 'Confirm certificate validation and failure behavior in a controlled environment.'],
    prevent: ['Use well-reviewed platform cryptography and current protocol defaults; avoid custom cryptographic schemes.', 'Store keys in managed secret systems, scope access, rotate after exposure, and separate keys by purpose.', 'Validate certificates and use cryptographically secure randomness for security-sensitive tokens.'],
    refs: [['OWASP Cryptographic Storage Cheat Sheet', 'https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html'], ['OWASP TLS Cheat Sheet', 'https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Security_Cheat_Sheet.html'], ['MITRE CWE', CWE]],
  },
  misconf: {
    title: 'Security misconfiguration', summary: 'A system is deployed with unsafe defaults, unnecessary exposure, or security controls that are missing or inconsistent.',
    develops: 'Development, build, cloud, and production environments drift. Debug routes, default credentials, permissive storage, verbose errors, excess services, or weak headers remain enabled because configuration ownership and verification are incomplete.',
    conditions: ['A component has a risky default or optional control.', 'The deployed configuration does not match the intended secure baseline.', 'The exposed feature or resource is reachable by an untrusted party.'],
    impact: 'Misconfiguration can expose data or administrative functions and can make other vulnerabilities easier to exploit.',
    verify: ['Compare deployed settings against a documented baseline in an authorized environment.', 'Review public storage permissions, debug endpoints, default accounts, headers, and unnecessary services.', 'Use non-production credentials and avoid changing shared production settings during assessment.'],
    prevent: ['Maintain versioned secure configuration and remove unused services and sample accounts.', 'Automate configuration checks in deployment and continuously monitor drift.', 'Return safe errors and separate development, test, and production credentials.'],
    refs: [['OWASP Top 10: Security Misconfiguration', 'https://owasp.org/Top10/A05_2021-Security_Misconfiguration/'], ['OWASP WSTG', WSTG], ['MITRE CWE', CWE]],
  },
  logic: {
    title: 'Business logic and design flaws', summary: 'The application’s rules allow a valid sequence of actions to violate a business or security invariant.',
    develops: 'Requirements encode assumptions about ordering, ownership, limits, pricing, approval, or one-time use. The implementation validates individual requests but does not preserve the overall invariant across alternate sequences, concurrent actions, retries, or edge cases.',
    conditions: ['A business rule has a security or financial consequence.', 'The system relies on a user-interface sequence or client-provided state.', 'Alternate or repeated valid requests can violate the intended invariant.'],
    impact: 'The flaw can enable unintended purchases, account changes, credits, workflow transitions, or access. Effects depend on the business rule and affected data.',
    verify: ['Write the intended invariant in plain language and test it with synthetic accounts and records.', 'Exercise allowed and denied state transitions, retries, duplicate submissions, and concurrency in staging.', 'Avoid real payments, irreversible actions, or changes to third-party accounts.'],
    prevent: ['Enforce business invariants server-side at the transaction boundary.', 'Make operations idempotent where retries are expected and use atomic state transitions.', 'Test negative cases and unusual sequences derived from the business rules, not only individual endpoints.'],
    refs: [['OWASP Web Security Testing Guide', WSTG], ['MITRE CWE Top 25', 'https://cwe.mitre.org/top25/'], ['MITRE CWE', CWE]],
  },
  dos: {
    title: 'Denial of service and resource exhaustion', summary: 'An input or request pattern consumes more time, memory, connections, or other resources than the service can safely provide.',
    develops: 'A code path performs work proportional to attacker-controlled size or complexity without bounds. Unbounded recursion, expensive parsing, unrestricted uploads, retry storms, or missing quotas can exhaust shared capacity.',
    conditions: ['An untrusted caller can trigger resource-intensive work.', 'The work is not bounded by input size, time, concurrency, or quotas.', 'The service shares the exhausted resource with legitimate users.'],
    impact: 'Users may experience slow responses, failures, or temporary loss of service. The scale depends on capacity, limits, and isolation.',
    verify: ['Use local benchmarks or a staging environment with explicit low ceilings.', 'Measure bounded workloads and stop automatically when latency or resource thresholds are reached.', 'Never run load or denial-of-service tests against production without a written test plan and rate limits.'],
    prevent: ['Set request size, time, concurrency, and recursion limits.', 'Use quotas, backpressure, queue limits, caching, and circuit breakers appropriate to the service.', 'Isolate expensive workloads and monitor resource saturation.'],
    refs: [['OWASP Denial of Service Cheat Sheet', 'https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html'], ['OWASP WSTG', WSTG], ['MITRE CWE', CWE]],
  },
  other: {
    title: 'Other and unclassified weaknesses', summary: 'The report’s weakness label does not map cleanly to a more specific class in this learning index.',
    develops: 'Public reports can use legacy, broad, or project-specific labels. Some reports have no weakness selected, and the local dataset may assign a best-effort class from the report title. Read the source write-up before treating the category as a technical root cause.',
    conditions: ['The taxonomy is too broad or incomplete for the report.', 'A report title or short label omits the relevant implementation detail.', 'The classification is inferred rather than supplied by the report.'],
    impact: 'The label alone does not establish impact. Read the evidence, affected asset, security boundary, and program response.',
    verify: ['Open the source report and identify the violated security property.', 'Trace the relevant input, identity, state, and output boundaries.', 'Mark uncertain classification as uncertain instead of inferring exploitability.'],
    prevent: ['Use a precise weakness taxonomy and preserve source attribution.', 'Review the root cause rather than treating “other” as a remediation category.', 'Reclassify when a clearer technical cause is established.'],
    refs: [['MITRE CWE', CWE], ['OWASP Web Security Testing Guide', WSTG]],
  },
};

export function weaknessNotes(name, classId) {
  const n = name.toLowerCase();
  if (classId === 'xss') {
    if (/dom/.test(n)) return 'DOM-based variants arise when browser-side code reads a value from a URL, message, or other source and passes it to a parsing sink. Review the full source-to-sink path and prefer text-oriented DOM APIs.';
    if (/stored|persistent/.test(n)) return 'Stored variants persist attacker-influenced data and later render it for one or more viewers. Review every write path and every display context, including administrative views and exports.';
    if (/reflected/.test(n)) return 'Reflected variants send request data back in a response that the browser parses. Trace the request value into the response and confirm context-aware output encoding.';
    return 'For this XSS label, identify whether the unsafe value is reflected, stored, or handled in the browser, then classify the exact output context. The required encoding differs between HTML text, attributes, URLs, CSS, and JavaScript.';
  }
  if (classId === 'injection') {
    if (/sql|database/.test(n)) return 'SQL injection occurs when data changes SQL syntax. Confirm whether each dynamic value uses a parameter binding and whether structural choices such as sort fields are selected from a fixed allowlist.';
    if (/command|code execution|code injection/.test(n)) return 'Command and code injection occur when an interpreter receives attacker-controlled syntax. Prefer APIs that pass arguments as structured data and avoid shell or eval construction.';
    if (/xml|xxe|entity/.test(n)) return 'XML external entity and related parser flaws depend on how external resources, entities, and schemas are resolved. Disable unnecessary external resolution and use a hardened parser.';
    if (/template/.test(n)) return 'Template injection arises when untrusted input becomes template source instead of template data. Keep templates application-owned and pass user values only as escaped data.';
    return 'Identify which interpreter processes the value and whether the value is data or syntax at that boundary. A defense suitable for one language or parser may not apply to another.';
  }
  if (classId === 'access') {
    if (/direct object|idor|object reference/.test(n)) return 'An IDOR is an authorization failure around a direct object reference. Changing an identifier is only a test input; the security question is whether the server verifies the caller’s permission for that object.';
    if (/privilege|role|authorization|permission/.test(n)) return 'Privilege and role failures arise when a server trusts role state or fails to check the exact action at the request boundary. Compare equivalent operations across test roles.';
  }
  if (classId === 'auth') {
    if (/session/.test(n)) return 'Session weaknesses concern token creation, rotation, scope, expiry, storage, or invalidation. Review the entire session lifecycle and the events that should revoke a session.';
    if (/password|credential|recovery/.test(n)) return 'Credential and recovery weaknesses arise when proof of account control is guessable, reusable, leaked, or weakly bound to the account. Review safe storage, rate limits, expiry, and notification flows.';
  }
  if (classId === 'path' && /upload/.test(n)) return 'Upload weaknesses can involve content validation, filename handling, storage location, permissions, or downstream processing. Treat client MIME types and extensions as claims, not proof.';
  if (classId === 'path' && /traversal|path|directory/.test(n)) return 'Traversal weaknesses arise when path resolution escapes an intended directory after decoding, normalization, or link resolution. Verify containment on the resolved path.';
  if (classId === 'race' || /race|toctou|time.of.check/.test(n)) return 'The important question is whether the check and state change are atomic. Reproduce only against disposable state and verify the invariant after concurrent requests.';
  if (classId === 'ssrf') return 'Map the untrusted destination value to the server-side client, then review parsing, DNS resolution, redirects, protocols, response handling, and network egress policy.';
  if (classId === 'csrf') return 'Check whether the request uses ambient credentials and whether the server verifies request intent. Review all state-changing endpoints, not only the form that first exposed the issue.';
  if (classId === 'http' && /smuggl|split|crlf|cache/.test(n)) return 'These variants often depend on different HTTP components parsing or caching the same request differently. Identify each hop and compare its interpretation in a controlled environment.';
  if (classId === 'memory') {
    if (/use after free|dangling|lifetime/.test(n)) return 'Lifetime errors occur when a reference remains usable after its object or buffer is released. Check ownership transfer, asynchronous callbacks, and cleanup paths.';
    if (/overflow|underflow|bounds|over.read|over.read/.test(n)) return 'Bounds errors occur when a size, index, or length calculation permits access outside an allocated object. Review arithmetic, conversions, and boundary conditions with sanitizers.';
  }
  if (/unspecified|unclassified|unclassified/.test(n)) return 'This label is broad or inferred. Use the source report to identify the exact violated security property before assigning a root cause.';
  return `This is a reported subtype of ${CLASS_GUIDES[classId]?.title || 'a security weakness'}. Compare the report’s affected component and violated security property with the class guidance; labels alone do not prove that two reports share the same root cause.`;
}
