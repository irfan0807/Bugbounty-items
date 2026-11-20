// Five small vulnerable-to-safer comparisons for every report class.
// Vulnerable snippets are inert teaching fixtures. Never paste them into a live service.
const option = (title, language, unsafe, lesson) => ({ title, language, unsafe, lesson });

export const CLASS_CODE_PAIRS = {
  xss: [
    option('Raw template string', 'python', 'return render_template_string(f"<p>{name}</p>")', 'Compiling caller data as a template lets it become markup; render a fixed template with autoescaping.'),
    option('DOM HTML sink', 'javascript', 'profileNode.innerHTML = profile.displayName;', 'The browser parses the value as HTML; use textContent for plain text.'),
    option('Raw React HTML', 'react', 'return <div dangerouslySetInnerHTML={{ __html: comment }} />;', 'This bypasses React escaping; render the value as a normal text child.'),
    option('Unescaped EJS output', 'express', '<span><%- displayName %></span>', 'EJS raw output skips escaping; use its escaped output tag for text.'),
    option('Concatenated response HTML', 'node', 'res.end("<p>" + displayName + "</p>");', 'String concatenation does not encode for an HTML context; use an autoescaping template or context encoder.'),
  ],
  injection: [
    option('Python query formatting', 'python', 'cursor.execute(f"SELECT id FROM users WHERE email = \'{email}\'")', 'Interpolation mixes data with SQL syntax; bind the value through the database driver.'),
    option('JavaScript query template', 'javascript', 'db.query(`SELECT id FROM users WHERE email = \'${email}\'`)', 'Template strings still build SQL syntax; pass a separate parameter array.'),
    option('Node query concatenation', 'node', 'pool.query("SELECT id FROM users WHERE email = \'" + email + "\'")', 'Concatenation makes untrusted text part of the command; bind it as a value.'),
    option('Express dynamic filter', 'express', 'app.get("/users", (req, res) => db.query("SELECT * FROM users WHERE name = \'" + req.query.name + "\'"));', 'Route parameters remain untrusted; use a parameterized query and explicit output fields.'),
    option('Dynamic SQL execution', 'sql', 'EXECUTE (\'SELECT id FROM users WHERE email = \'\'\' + @email + \'\'\');', 'Do not assemble SQL text from values; use a prepared statement parameter.'),
  ],
  info: [
    option('Serialize the whole model', 'python', 'return jsonify(user.__dict__)', 'Internal model fields can leak accidentally; build an explicit response schema.'),
    option('Return verbose errors', 'javascript', 'res.status(500).json({ error: err.stack, config });', 'Stack traces and configuration reveal implementation details; log privately and return a generic error.'),
    option('Hide a field only in React', 'react', 'return <pre>{JSON.stringify(account)}</pre>; // CSS hides private fields', 'Anything delivered to the browser is exposed; omit unauthorized fields at the API.'),
    option('Send the database row', 'express', 'app.get("/me", requireUser, (req, res) => res.json(req.userRow));', 'A database row may contain internal fields; return an allowlisted public view.'),
    option('Select every column', 'sql', 'SELECT * FROM account WHERE id = ?;', 'Schema growth can silently expose new sensitive columns; select only needed fields.'),
  ],
  access: [
    option('Lookup by caller ID only', 'python', 'doc = Document.objects.get(id=request.GET["id"])', 'An identifier is not authorization; scope the query to the authenticated owner or tenant.'),
    option('Unscoped client fetch', 'javascript', 'const doc = await fetch(`/api/docs/${docId}`).then(r => r.json());', 'The server must authorize this object; client-side hiding cannot enforce ownership.'),
    option('Trust a client role flag', 'react', 'return isAdmin ? <AdminPanel /> : null;', 'A UI role controls presentation only; every admin API action must check trusted server state.'),
    option('Express fetch without owner check', 'express', 'app.get("/docs/:id", requireUser, async (req, res) => res.json(await docs.findById(req.params.id)));', 'Authentication alone does not grant access to every record; authorize the specific object.'),
    option('Update row by ID only', 'sql', 'UPDATE documents SET title = ? WHERE id = ?;', 'Bind the owner or tenant from trusted session state into the update condition.'),
  ],
  auth: [
    option('Fixed recovery token', 'python', 'token = "reset-" + str(user.id)', 'Predictable tokens do not prove identity; generate cryptographically random, single-use tokens.'),
    option('Math.random token', 'javascript', 'const token = Math.random().toString(36).slice(2);', 'General-purpose randomness is not for credentials; use the platform crypto API.'),
    option('Session without rotation', 'node', 'req.session.userId = user.id; // keep pre-login session ID', 'Rotate the session identifier after authentication to prevent fixation.'),
    option('Static session secret', 'express', 'app.use(session({ secret: "development" }));', 'A checked-in or default secret is shared and predictable; load a managed runtime secret and fail closed.'),
    option('Store password directly', 'sql', 'INSERT INTO credential(user_id, password) VALUES (?, ?);', 'Never store a password as plaintext; store a framework-generated adaptive hash.'),
  ],
  csrf: [
    option('Unprotected state change', 'python', 'def update_email(request):\n    save_email(request.user, request.POST["email"])', 'Cookie-authenticated changes need request-intent validation such as framework CSRF middleware.'),
    option('Cookie request without token', 'javascript', 'fetch("/api/email", { method: "POST", credentials: "include", body: JSON.stringify({ email }) });', 'Ambient cookies are attached automatically; include and validate a server-issued CSRF token.'),
    option('Form without intent token', 'react', '<form method="post" action="/settings/email"><input name="email" /><button>Save</button></form>', 'A form can be submitted cross-site; include a token and validate it on the server.'),
    option('Express route skips guard', 'express', 'app.post("/settings/email", requireUser, changeEmail);', 'Authentication does not prove the user intended this cross-origin request; add CSRF protection.'),
    option('Allow credentialed cross-origin', 'javascript', 'Access-Control-Allow-Origin: *\nAccess-Control-Allow-Credentials: true', 'Do not combine broad cross-origin access with ambient credentials; use a strict origin policy.'),
  ],
  ssrf: [
    option('Fetch caller URL', 'python', 'response = requests.get(request.args["url"], timeout=10)', 'A caller-controlled destination can reach places the server can access; map approved IDs to fixed destinations.'),
    option('Server fetch from body', 'javascript', 'const response = await fetch(req.body.url);', 'Validate destination at connection time, constrain redirects, and enforce network egress policy.'),
    option('Follow arbitrary redirects', 'node', 'await httpClient.get(userProvidedUrl, { followRedirects: true });', 'Redirects can change the destination after validation; revalidate each hop or disable redirects.'),
    option('Unrestricted preview endpoint', 'express', 'app.post("/preview", async (req, res) => res.json(await fetch(req.body.url)));', 'Accept a known partner identifier instead of an arbitrary URL; apply egress and response limits.'),
    option('Trust any hostname setting', 'python', 'ALLOWED_HOSTS = ["*"]', 'A wildcard host policy removes the intended boundary; enumerate reviewed destinations.'),
  ],
  path: [
    option('Join request path', 'python', 'path = UPLOAD_ROOT / request.args["file"]\nreturn path.read_bytes()', 'A request fragment can escape its storage directory; resolve and enforce canonical containment.'),
    option('Prefix-only containment', 'javascript', 'if (!resolved.startsWith(root)) throw new Error("denied");', 'A sibling path can share the same text prefix; compare canonical paths with a separator-aware boundary.'),
    option('Send caller path', 'node', 'res.sendFile(req.query.path);', 'A file API should accept an opaque authorized ID, not a raw path.'),
    option('Express path from route', 'express', 'app.get("/files/*", (req, res) => res.sendFile(req.params[0]));', 'Do not pass wildcard route data to filesystem APIs; resolve a server-owned storage key.'),
    option('Store user path as key', 'sql', 'INSERT INTO stored_file(storage_path) VALUES (?); -- value comes from request', 'Keep display names separate from server-generated storage keys and authorize the record.'),
  ],
  race: [
    option('Check then save separately', 'python', 'if not coupon.used:\n    coupon.used = True\n    coupon.save()', 'Two requests may pass the check together; make the state transition atomic.'),
    option('Client busy flag only', 'react', 'if (!busy) { setBusy(true); redeem(); }', 'A browser flag cannot coordinate multiple tabs or callers; enforce one-time use in the database.'),
    option('Express read then update', 'express', 'if (!(await coupons.isUsed(code))) await coupons.markUsed(code);', 'The gap between read and write permits a race; use one transaction or conditional update.'),
    option('Node check then write', 'node', 'const row = await db.get(id);\nif (!row.used) await db.update(id, { used: true });', 'Enforce the condition and mutation in one atomic operation, then inspect affected-row count.'),
    option('No uniqueness invariant', 'sql', 'CREATE TABLE claim(user_id BIGINT, reward_id BIGINT);', 'A durable invariant needs a unique constraint or equivalent atomic database rule.'),
  ],
  logic: [
    option('Trust caller total', 'python', 'total = Decimal(request.json["total"])\ncreate_order(user, total)', 'Prices and eligibility are business state; recompute them from trusted catalog records.'),
    option('Accept client price', 'javascript', 'await submitOrder({ itemId, price: cart.price });', 'Send product IDs and quantities; reload current prices and calculate the total server-side.'),
    option('Client-only eligibility', 'react', 'return eligible ? <button onClick={claim}>Claim</button> : null;', 'A hidden button is bypassable; recheck eligibility when the server commits the action.'),
    option('Trust request discount flag', 'express', 'const total = subtotal - (req.body.discount || 0);', 'Derive discounts from server-owned rules and verify account eligibility at commit time.'),
    option('Missing durable quantity rule', 'sql', 'CREATE TABLE order_line(quantity INTEGER);', 'Add database constraints for simple invariants and validate workflow rules transactionally.'),
  ],
  http: [
    option('Trust every forwarded header', 'python', 'SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https") # trust all peers', 'Only trust forwarded headers from known proxy addresses; otherwise callers can spoof them.'),
    option('Use raw redirect target', 'javascript', 'location.assign(new URLSearchParams(location.search).get("next"));', 'Parse the target and allow only the expected origin or a constrained relative path.'),
    option('Open new tab without isolation', 'react', '<a href={url} target="_blank">Open</a>', 'Use a reviewed destination and add rel="noopener noreferrer" to isolate the opener.'),
    option('Trust arbitrary proxy chain', 'express', 'app.set("trust proxy", true);', 'Trust only the known proxy topology; blanket trust can corrupt client IP and scheme decisions.'),
    option('Ambiguous framing accepted', 'node', 'server.on("request", handleRequest); // no edge parser agreement', 'Keep proxy and origin parsers patched and aligned; reject ambiguous framing at the boundary.'),
  ],
  crypto: [
    option('General-purpose random token', 'python', 'token = random.randint(100000, 999999)', 'Use cryptographic randomness with sufficient entropy for a bearer credential.'),
    option('Math.random reset token', 'javascript', 'const token = Math.random().toString(36).slice(2);', 'Use crypto.randomBytes or Web Crypto; bind the token to account, purpose, expiry, and single use.'),
    option('Reuse a fixed IV', 'node', 'const cipher = createCipheriv("aes-256-gcm", key, Buffer.alloc(12));', 'Authenticated encryption requires a unique nonce per key; use a vetted nonce strategy.'),
    option('Persist raw reset token', 'express', 'await resetTokens.insert({ userId, token });', 'Store a verifier, not the bearer secret, and remove it after expiry or use.'),
    option('Keep reversible password', 'sql', 'CREATE TABLE credential(user_id BIGINT, password TEXT);', 'Store an adaptive password hash, never plaintext or a reversible encoding.'),
  ],
  misconf: [
    option('Debug enabled in deployment', 'python', 'DEBUG = True', 'Disable debug mode in production; detailed errors can disclose internals.'),
    option('Secret in source', 'javascript', 'const signingKey = "skynet-demo-secret";', 'Load secrets from managed server-side runtime configuration and rotate exposed values.'),
    option('Wildcard CORS', 'express', 'app.use(cors({ origin: "*", credentials: true }));', 'Use an explicit origin allowlist and avoid broad credentialed cross-origin access.'),
    option('Detailed error to caller', 'node', 'res.status(500).send(err.stack);', 'Return a generic error and record necessary detail only in protected logs.'),
    option('Overpowered database role', 'sql', 'GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_user;', 'Grant only the operations and tables this service needs.'),
  ],
  dos: [
    option('Unbounded request body', 'express', 'app.use(express.json({ limit: "100gb" }));', 'Set a product-appropriate body limit before parsing.'),
    option('Process every item', 'javascript', 'return items.map(expensiveTransform);', 'Bound collection size, paginate, and cap concurrent work.'),
    option('Allocate caller size', 'node', 'const buffer = Buffer.alloc(Number(req.query.size));', 'Validate a strict maximum before allocation; reject invalid and excessive sizes.'),
    option('No request rate boundary', 'express', 'app.post("/expensive", requireUser, runExpensiveJob);', 'Use per-user limits, timeouts, cancellation, and bounded queues around costly work.'),
    option('Unbounded result query', 'sql', 'SELECT * FROM audit_event WHERE tenant_id = ? ORDER BY created_at DESC;', 'Use a limit, index-aware pagination, and query timeouts.'),
  ],
  redirect: [
    option('Redirect to caller value', 'python', 'return redirect(request.args["next"])', 'Allow only relative application paths or an explicit set of parsed origins.'),
    option('Prefix check on URL', 'javascript', 'if (next.startsWith("https://app.example")) location.href = next;', 'String prefixes can match a different host; parse the URL and compare exact origin.'),
    option('Render unchecked destination', 'react', '<a href={searchParams.get("next")}>Continue</a>', 'Validate before rendering; otherwise the link may leave the intended site.'),
    option('Set Location directly', 'express', 'res.set("Location", req.query.next).sendStatus(302);', 'Use a server-owned relative path or validated same-origin URL.'),
    option('Trust forwarded host', 'node', 'const destination = req.headers.host + req.url;', 'Do not build security-sensitive redirect origins from untrusted Host headers.'),
  ],
  memory: [
    option('Unbounded string copy', 'c', 'char name[8];\nstrcpy(name, input);', 'Copying without capacity checks writes beyond the local buffer; check length and reserve the NUL byte.'),
    option('Caller length to memcpy', 'c', 'memcpy(dst, src, input_length); // dst capacity is 16', 'The requested length must not exceed the destination capacity; validate before copying.'),
    option('Unbounded format output', 'c', 'char out[32];\nsprintf(out, "%s", input);', 'Use a bounded formatter and check its return value.'),
    option('Off-by-one terminator', 'c', 'char name[8];\nmemcpy(name, input, 8);\nname[8] = \'\\0\';', 'Index 8 lies outside an 8-byte array; account for the terminator within capacity.'),
    option('Use allocation without check', 'c', 'char *p = malloc(user_size);\nmemcpy(p, input, user_size);', 'Validate the size, check allocation success, and ensure source and destination lengths are compatible.'),
  ],
  ui: [
    option('Accept every postMessage origin', 'javascript', 'window.addEventListener("message", e => applyAction(e.data));', 'Verify origin and message schema before acting on cross-window data.'),
    option('Render message as HTML', 'react', 'return <div dangerouslySetInnerHTML={{ __html: message.data }} />;', 'Render untrusted messages as text and validate their source.'),
    option('Trust an iframe message', 'javascript', 'frame.addEventListener("message", e => setAccount(e.data.account));', 'Check the expected origin, source window, schema, and allowed state transition.'),
    option('Evaluate message command', 'javascript', 'window.addEventListener("message", e => eval(e.data));', 'Never evaluate message content; map validated action names to fixed handlers.'),
    option('Trust client visibility', 'react', 'return canDelete ? <button onClick={deleteRecord}>Delete</button> : null;', 'A UI condition cannot enforce access; the server must authorize the delete request.'),
  ],
  other: [
    option('Skip server authorization', 'python', 'def update_record(user, record_id, data):\n    return Record.objects.get(id=record_id).update(**data)', 'Identify the report’s actual invariant and enforce actor, object, and action policy at the server boundary.'),
    option('Trust client-provided state', 'javascript', 'await save({ id, ownerId, approved: true });', 'Derive identity and protected state from trusted server records, not caller fields.'),
    option('Client-only restriction', 'react', 'return allowed ? <SensitiveView /> : null;', 'UI restrictions improve clarity but do not protect an API or stored resource.'),
    option('Express accepts arbitrary object', 'express', 'app.patch("/item/:id", (req, res) => update(req.params.id, req.body));', 'Validate fields and enforce authorization and business rules before applying changes.'),
    option('No database invariant', 'sql', 'CREATE TABLE resource(owner_id BIGINT, name TEXT);', 'Use constraints for durable data invariants and application policy for actor authorization.'),
  ],
};

const bugExample = (title, language, context, code, why, sourceName, sourceUrl) => ({ title, language, context, code, why, sourceName, sourceUrl });
const methodology = 'https://github.com/irfan0807/awesome-bugbounty-resources/blob/main/methodology/web-app-testing.md';
const checklist = 'https://github.com/irfan0807/awesome-bugbounty-resources/blob/main/checklists/bug-bounty-checklist.md';

// Local illustrative reproductions based on the user's repository materials.
// Only the C boundary sample is a short direct excerpt; repository test scripts are not misrepresented as vulnerable apps.
export const CLASS_REAL_BUG_EXAMPLES = {
  xss: bugExample('Stored profile value reaches an HTML sink', 'JavaScript', 'A profile display name saved by one user is later inserted into a moderator page as HTML.', 'profileCard.innerHTML = `<p>${profile.displayName}</p>`;', 'The browser parses the stored value as markup. The user-controlled value crosses from data into an HTML parsing context without context-aware encoding.', 'BugBounty-learning / BasicXSS.html and XSS study material', 'https://github.com/irfan0807/BugBounty-learning/blob/master/BasicXSS.html'),
  injection: bugExample('Search value is concatenated into SQL', 'Python / SQL', 'A search endpoint turns a submitted username into part of the database command.', 'query = f"SELECT id FROM users WHERE username = \'{username}\'"\nrows = db.execute(query)', 'Input becomes SQL syntax instead of remaining a bound value. The repository includes an injection test script; this snippet is a local app-side illustration, not that scanner.', 'cybersecurity-penetration-testing / Chapter 04 / injection.py', 'https://github.com/irfan0807/cybersecurity-penetration-testing/blob/main/pentest-scripts/effective-python-penetration-testing/Chapter%2004/injection.py'),
  info: bugExample('Internal account fields are serialized into a public response', 'Python / Flask', 'A profile route returns a model object containing fields such as password hashes, recovery state, or internal notes.', 'return jsonify(account.__dict__)', 'The serializer exposes every current model attribute. Adding a new database field can silently expand what the API returns.', 'awesome-bugbounty-resources / web app testing methodology', methodology),
  access: bugExample('Document lookup checks the ID but not its owner', 'Python / ORM', 'A signed-in user requests a document by numeric ID; the route returns the record without checking ownership or tenant.', 'document = db.get(Document, request.args["id"])\nreturn jsonify(document.to_dict())', 'Authentication proves who is calling, not that the caller may read this object. The user repo has a Direct Object Reference test script; this is the corresponding local route pattern.', 'cybersecurity-penetration-testing / Chapter 04 / Direct-object-reference.py', 'https://github.com/irfan0807/cybersecurity-penetration-testing/blob/main/pentest-scripts/effective-python-penetration-testing/Chapter%2004/Direct-object-reference.py'),
  auth: bugExample('Recovery credential is predictable', 'Python', 'A password-reset service derives a bearer token from a public account identifier.', 'reset_token = f"reset-{account.id}"\nstore_reset_token(account.id, reset_token)', 'Anyone who can infer the account ID can reproduce the same token. Recovery credentials need cryptographic randomness, account binding, expiry, and single-use state.', 'awesome-bugbounty-resources / bug bounty checklist', checklist),
  csrf: bugExample('Cookie-authenticated state change has no intent check', 'Python / Flask', 'The browser automatically sends its session cookie when this endpoint changes the signed-in user’s email address.', '@app.post("/settings/email")\n@login_required\ndef update_email():\n    current_user.email = request.form["email"]\n    db.commit()', 'Login authentication does not prove that the user intended this cross-site request. The repo contains a CSRF test script; this is an illustrative local endpoint.', 'cybersecurity-penetration-testing / Chapter 04 / CSRF.py', 'https://github.com/irfan0807/cybersecurity-penetration-testing/blob/main/pentest-scripts/effective-python-penetration-testing/Chapter%2004/CSRF.py'),
  ssrf: bugExample('Preview endpoint fetches a caller-supplied URL', 'Python', 'A backend preview feature retrieves an image or page URL supplied by the caller.', 'url = request.json["preview_url"]\npreview = requests.get(url, timeout=5)\nreturn preview.text', 'The server makes the network request with its own reach and credentials. URL parsing alone does not constrain redirects or the address reached at connection time.', 'awesome-bugbounty-resources / web app testing methodology', methodology),
  path: bugExample('Download route joins a caller-supplied filename', 'Python', 'A download handler accepts a path fragment and opens it under the upload directory.', 'filename = request.args["file"]\nreturn send_file(UPLOAD_DIR / filename)', 'Path joining does not prove the resolved file remains inside the intended directory. Normalize and enforce containment, then authorize an opaque file ID.', 'awesome-bugbounty-resources / bug bounty checklist', checklist),
  race: bugExample('One-time coupon uses a separate check and update', 'Python / ORM', 'Two requests can both read the coupon as unused before either request commits the redemption.', 'if not coupon.used:\n    coupon.used = True\n    db.commit()\n    grant_discount()', 'The check and state change are not atomic. A database conditional update or transaction must enforce the one-redemption invariant.', 'awesome-bugbounty-tools / race condition testing references', 'https://github.com/irfan0807/awesome-bugbounty-tools'),
  logic: bugExample('Checkout trusts the browser’s submitted total', 'JavaScript / Express', 'The browser posts a cart total and the server uses it directly when creating the order.', 'app.post("/orders", async (req, res) => {\n  const order = await orders.create(req.user.id, req.body.total);\n  res.json(order);\n});', 'The caller controls the total. The server must reload catalog prices, ownership, discount rules, and workflow state before committing.', 'awesome-bugbounty-resources / web app testing methodology', methodology),
  http: bugExample('Application trusts proxy headers from any client', 'Node.js / Express', 'The app uses forwarded scheme and client address fields even when a request did not arrive through the trusted proxy.', 'app.set("trust proxy", true);\nconst clientIp = req.ip;\nconst secureLink = req.protocol === "https";', 'A direct caller may spoof forwarding headers, affecting rate limits, audit attribution, or security-sensitive URL generation. Trust only the known proxy topology.', 'cybersecurity-penetration-testing / web testing references', 'https://github.com/irfan0807/cybersecurity-penetration-testing/tree/main/PenTest-CheatSheets'),
  crypto: bugExample('Password is stored as a fast unsalted digest', 'Python', 'A login system hashes a password with a general-purpose digest before saving it.', 'password_hash = hashlib.md5(password.encode()).hexdigest()\ndb.save(account.id, password_hash)', 'Fast general-purpose digests are not password hashing schemes and make offline guessing cheaper. Use a maintained adaptive password hasher.', 'cybersecurity-penetration-testing / Python security references', 'https://github.com/irfan0807/cybersecurity-penetration-testing/tree/main/PenTest-CheatSheets'),
  misconf: bugExample('Debug mode and a known secret ship together', 'Python', 'A development configuration is reused in a deployed environment.', 'DEBUG = True\nSECRET_KEY = "dev-secret"', 'Debug pages can disclose internals, while a known signing secret can undermine sessions or tokens. Fail startup on unsafe deployment settings.', 'awesome-bugbounty-resources / bug bounty checklist', checklist),
  dos: bugExample('Unbounded request body is parsed synchronously', 'Python / Flask', 'An endpoint parses an arbitrarily large JSON body and walks every supplied record in one request.', 'records = request.get_json()\nresult = [expensive_transform(row) for row in records]', 'There is no size, item-count, execution-time, or concurrency bound before costly work begins. Reject oversized input and bound work at the server boundary.', 'awesome-bugbounty-resources / web app testing methodology', methodology),
  redirect: bugExample('Return path is sent directly to the redirect response', 'Python / Flask', 'A login page returns the browser to a query-string destination after authentication.', 'return redirect(request.args.get("next", "/"))', 'The destination is untrusted and may send the user to an unrelated site. Parse it and allow only approved relative paths or exact origins.', 'awesome-bugbounty-resources / bug bounty checklist', checklist),
  memory: bugExample('Password copy can exceed a fixed stack buffer', 'C', 'The repository’s local teaching program copies a caller-provided password into a 16-byte array without checking its length.', 'char password_buffer[16];\nstrcpy(password_buffer, password);', 'strcpy keeps copying until a NUL byte and has no destination-capacity parameter. This is a short excerpt from the repo’s auth_overflow.c; study it only as a local memory-safety lesson.', 'cybersecurity-penetration-testing / hacking-art-of-exploitation / auth_overflow.c', 'https://github.com/irfan0807/cybersecurity-penetration-testing/blob/main/pentest-scripts/hacking-art-of-exploitation/auth_overflow.c'),
  ui: bugExample('Cross-window message is trusted without origin checks', 'JavaScript', 'A payment or account page accepts messages from embedded windows and immediately applies their data.', 'window.addEventListener("message", event => {\n  applyAccountAction(event.data);\n});', 'Any origin able to message the window can reach the handler. Check origin, source window, message schema, and the allowed state transition.', 'cybersecurity-penetration-testing / web security references', 'https://github.com/irfan0807/cybersecurity-penetration-testing/tree/main/PenTest-CheatSheets'),
  other: bugExample('Bulk update accepts every submitted model field', 'Python / Flask', 'A broad report label cannot identify a root cause by itself; this shows one possible mass-assignment flaw in a local fixture.', 'fields = request.get_json()\nfor key, value in fields.items():\n    setattr(record, key, value)\ndb.commit()', 'The caller may change fields the endpoint never intended to expose. Confirm the actual violated property from the source report before assigning a specific weakness.', 'awesome-bugbounty-resources / methodology and checklist', methodology),
};
