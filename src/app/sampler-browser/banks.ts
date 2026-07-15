/**
 * banks.ts - the sample maps the dropdown offers out of the box.
 *
 * These are community `strudel.json` repositories, the same universe strudel.cc
 * pulls from. Each is a `github:owner/repo` pseudo-URL that lib/samples.ts resolves
 * to a `raw.githubusercontent.com/.../strudel.json`. Picking one loads it (there is no
 * Load button); "Custom..." in the dropdown is for anything not on this list.
 *
 * DATA, not code, and kept out of App.tsx for exactly that reason: this list will grow
 * and churn as the community publishes maps, and a churny array does not belong in the
 * middle of a component. `tidalcycles/Dirt-Samples` leads because it is the recognised
 * classic and it loads - it is what the device auto-loads on open.
 *
 * KEEP THIS CURATED with scripts/check-sample-maps.mjs, which fetches every entry the way
 * the device does and reports 404s, empty maps and dead sample files. `felixroos/dough-
 * samples` used to lead here and was removed: it has no strudel.json on either branch, so
 * it 404s - the exact thing the checker exists to catch.
 */
export interface SampleBank {
	label: string;
	url: string;
}

/** `github:owner/repo`, labelled by the repo path itself - which is what the user
 *  recognises it by, and what strudel.cc calls it. */
const gh = (repo: string): SampleBank => ({ label: repo, url: `github:${repo}` });

export const PRESET_MAPS: SampleBank[] = [
	{ label: "Dirt-Samples (Tidal classic)", url: "github:tidalcycles/Dirt-Samples" },
	gh("algorave-dave/samples"),
	gh("AuditeMarlow/samples"),
	gh("AustinOliverHaskell/ms-teams-sounds-strudel"),
	gh("bruveping/RepositorioDesonidosParaExperimentar02"),
	gh("Bubobubobubobubo/Dough-Amen"),
	gh("Bubobubobubobubo/Dough-Juj"),
	gh("eddyflux/crate"),
	gh("EloMorelo/samples"),
	gh("emrexdeger/strudelSamples"),
	gh("fjpolo/fjpolo-Strudel"),
	gh("fstiffo/polifonia-samples"),
	gh("hvillase/cavlp-25p"),
	gh("k09/samples"),
	gh("kaiye10/strudelSamples"),
	gh("mot4i/garden"),
	gh("mysinglelise/msl-strudel-samples"),
	gh("Nikeryms/Samples"),
	gh("prismograph/departure"),
	gh("QuantumVillage/quantum-music"),
	gh("RikyBac15/samples"),
	gh("salsicha/capoeira_strudel"),
	gh("sonidosingapura/rochormatic"),
	gh("terrorhank/samples"),
	gh("tesspilot/samples"),
	gh("TodePond/samples"),
	gh("TristanCacqueray/mirus"),
	gh("Veikkosuhonen/graffathon25-demo"),
	gh("wyan/livecoding-samples"),
	gh("yaxu/clean-breaks"),
];
