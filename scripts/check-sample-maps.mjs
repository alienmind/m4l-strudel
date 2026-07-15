/**
 * check-sample-maps.mjs - is a sample map real, and does it have sounds in it?
 *
 *   node scripts/check-sample-maps.mjs
 *
 * A curation tool for the sample-browser dropdown. Each repo below is fetched exactly
 * the way the device fetches it (github:owner/repo -> raw.githubusercontent.com/.../
 * <branch>/strudel.json), the catalog is parsed with the same rules as
 * src/lib/samples.ts, and the FIRST sample file is HEAD-checked - because a strudel.json
 * that lists sounds whose files 404 is just as useless as one that is missing.
 *
 * Verdicts:
 *   OK        the catalog loads and its first file exists
 *   EMPTY     the catalog loads but lists no sounds
 *   DEAD-FILE the catalog lists sounds, but the first file 404s
 *   404       no strudel.json at that repo (on `main` OR `master`)
 *   BRANCH    a strudel.json exists on `master`, but the device only tries `main`
 *   ERROR     network/parse failure (see the message)
 *
 * The device resolves ONLY `main` (see githubUrl() in lib/samples.ts). This script also
 * probes `master`, so a repo that would 404 in the device but works on master is called
 * out as BRANCH rather than silently failing - that is a fixable curation problem (fork,
 * or rename the branch), not a dead repo.
 *
 * REPOS is static and lives at the top on purpose: paste a new `owner/repo` in, re-run,
 * and see whether it is worth adding. Keep it in step with src/app/sampler-browser/banks.ts.
 */

const REPOS = [
	"tidalcycles/Dirt-Samples",
	"algorave-dave/samples",
	"AuditeMarlow/samples",
	"AustinOliverHaskell/ms-teams-sounds-strudel",
	"bruveping/RepositorioDesonidosParaExperimentar02",
	"Bubobubobubobubo/Dough-Amen",
	"Bubobubobubobubo/Dough-Juj",
	"eddyflux/crate",
	"EloMorelo/samples",
	"emrexdeger/strudelSamples",
	"fjpolo/fjpolo-Strudel",
	"fstiffo/polifonia-samples",
	"hvillase/cavlp-25p",
	"k09/samples",
	"kaiye10/strudelSamples",
	"mot4i/garden",
	"mysinglelise/msl-strudel-samples",
	"Nikeryms/Samples",
	"prismograph/departure",
	"QuantumVillage/quantum-music",
	"RikyBac15/samples",
	"salsicha/capoeira_strudel",
	"sonidosingapura/rochormatic",
	"terrorhank/samples",
	"tesspilot/samples",
	"TodePond/samples",
	"TristanCacqueray/mirus",
	"Veikkosuhonen/graffathon25-demo",
	"wyan/livecoding-samples",
	"yaxu/clean-breaks",
];

/** How many repos to probe at once. Polite to raw.githubusercontent, fast enough. */
const CONCURRENCY = 6;
const TIMEOUT_MS = 15_000;

const rawBase = (repo, branch) => `https://raw.githubusercontent.com/${repo}/${branch}/`;

async function fetchWithTimeout(url, { method = "GET" } = {}) {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
	try {
		return await fetch(url, { method, signal: controller.signal, redirect: "follow" });
	} finally {
		clearTimeout(timer);
	}
}

/** The absolute URLs behind a strudel.json - the same three value shapes lib/samples.ts
 *  handles (list, lone string, note-keyed object), flattened to a plain list of files. */
function sampleUrls(json, base) {
	const urls = [];
	for (const [name, value] of Object.entries(json)) {
		if (name.startsWith("_")) continue;
		if (Array.isArray(value)) urls.push(...value.map((u) => base + String(u)));
		else if (typeof value === "string") urls.push(base + value);
		else if (value && typeof value === "object") urls.push(...Object.values(value).flat().map((u) => base + String(u)));
	}
	return urls;
}

function soundCount(json) {
	return Object.keys(json).filter((k) => !k.startsWith("_")).length;
}

/** Try `main`, then `master`. Returns { branch, json } or null if neither has a strudel.json. */
async function loadCatalog(repo) {
	for (const branch of ["main", "master"]) {
		const url = rawBase(repo, branch) + "strudel.json";
		const res = await fetchWithTimeout(url);
		if (res.ok) {
			const json = await res.json();
			const base = typeof json._base === "string" ? json._base : rawBase(repo, branch);
			return { branch, json, base };
		}
	}
	return null;
}

async function check(repo) {
	try {
		const cat = await loadCatalog(repo);
		if (!cat) return { repo, verdict: "404", detail: "no strudel.json on main or master" };

		const count = soundCount(cat.json);
		if (count === 0) return { repo, verdict: "EMPTY", detail: `branch ${cat.branch}, 0 sounds` };

		// A catalog full of dead links looks fine until you play it. HEAD the first file.
		const [firstUrl] = sampleUrls(cat.json, cat.base);
		let fileNote = "";
		if (firstUrl) {
			const head = await fetchWithTimeout(firstUrl, { method: "HEAD" });
			if (!head.ok) return { repo, verdict: "DEAD-FILE", detail: `${count} sounds, but first file ${head.status}` };
			fileNote = "first file OK";
		}

		if (cat.branch !== "main") {
			return { repo, verdict: "BRANCH", detail: `${count} sounds on '${cat.branch}' - device only tries 'main'` };
		}
		return { repo, verdict: "OK", detail: `${count} sounds, ${fileNote}` };
	} catch (err) {
		const msg = err?.name === "AbortError" ? `timeout after ${TIMEOUT_MS / 1000}s` : err?.message || String(err);
		return { repo, verdict: "ERROR", detail: msg };
	}
}

/** Run checks with a small pool rather than all at once. */
async function run() {
	const results = [];
	const queue = [...REPOS];
	async function worker() {
		while (queue.length) {
			const repo = queue.shift();
			const r = await check(repo);
			results.push(r);
			console.log(`  ${r.verdict.padEnd(10)} ${r.repo.padEnd(52)} ${r.detail}`);
		}
	}
	console.log(`Checking ${REPOS.length} sample maps (main, then master)...\n`);
	await Promise.all(Array.from({ length: CONCURRENCY }, worker));

	// Summary, grouped by verdict, ordered worst-to-best so the curation work is on top.
	const order = ["404", "EMPTY", "DEAD-FILE", "BRANCH", "ERROR", "OK"];
	const byVerdict = Object.fromEntries(order.map((v) => [v, results.filter((r) => r.verdict === v)]));
	console.log("\n----- summary -----");
	for (const v of order) {
		const list = byVerdict[v];
		if (list.length) console.log(`${v.padEnd(10)} ${list.length}`);
	}

	const bad = order.slice(0, 5).flatMap((v) => byVerdict[v]);
	if (bad.length) {
		console.log("\nNeeds curation:");
		for (const r of bad.sort((a, b) => a.repo.localeCompare(b.repo))) {
			console.log(`  ${r.repo}  (${r.verdict}: ${r.detail})`);
		}
	}

	console.log("\nKeep (paste into banks.ts):");
	for (const r of byVerdict.OK.sort((a, b) => a.repo.localeCompare(b.repo))) {
		console.log(`  gh("${r.repo}"),`);
	}
}

run();
