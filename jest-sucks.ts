import os from "os"
import fs from "fs";
import path from "path";

process.on("uncaughtException", (e) => {
	console.error("jest-sucks - uncaughtException:\n\n", e);
	process.exit(1);
});

process.on("unhandledRejection", (e) => {
	console.error("jest-sucks - unhandledRejection:\n\n", e);
	process.exit(1);
});

export type Opts = { log?: 0 | 1 | 2 | 3; not?: boolean };

export type RunResult = { passed: boolean; it: string; received: string; expected: string; opts: Opts };

export const run = (
	it: string,
	received: string, //
	expected: string,
	opts: Opts = {}
): RunResult => {
	const { log = 1, not = false } = opts;

	const passed: boolean = received === expected && !not;

	if (log) {
		console.log(
			passed ? "  " : " X",
			passed,
			(passed ? " " : "") /** make both `true` and `false` 5 chars */ + it,
			// { "received === expected": received === expected, not, },
			...(log >= 3 || (log >= 2 && !passed) ? [received, "\n", expected] : [])
		);
	}

	return { passed, it, received, expected, opts };
};

const didPass = ({ passed }: RunResult): boolean => passed;
const didNotPass = ({ passed }: RunResult): boolean => !passed;

/**
 * args:
 * 1. it should do what?
 * 2. received
 * 3. expected
 * 4. options?
 */
export const runMany = (
	// TODO Opts as (conditional) second arg
	args: [string, string, string, Opts?][],  // TODO ESLINT
	// args: any[], //
	runResults: RunResult[] = [],
	passedRunResults: RunResult[] = [],
	failedRunResults: RunResult[] = [],
	failedResultFilePath: string = path.join(os.tmpdir(), path.basename(process.cwd()), "test-results.failed.json")
): typeof runResults => (
	(runResults = args.map(([it, received, expected, opts]) => run(it, received, expected, opts))),
	console.log(),
	(passedRunResults = runResults.filter(didPass)),
	(failedRunResults = runResults.filter(didNotPass)),
	console.log(
		passedRunResults.length, //
		"/",
		runResults.length,
		"\n\n=>",
		failedRunResults.length ? "fail" : "success",
		"\n"
	),
	// TODO configurable:
	failedRunResults.length
		? (fs.mkdirSync(path.dirname(failedResultFilePath), { recursive: true }), fs.writeFileSync(failedResultFilePath, JSON.stringify(failedRunResults, null, 2)))
		: fs.existsSync(failedResultFilePath) && (fs.writeFileSync(failedResultFilePath, "[]")/*, fs.unlinkSync(failedResultFilePath)*/ ),
	failedRunResults.length && console.log(failedResultFilePath, "\n\n\n"),
	failedRunResults.length && process.exit(1),
	runResults
);

export const runManyWithVerboseArgs = (
	args: { it: string; expected: string; received: string; opts?: Opts }[],
	argsNormalized: Parameters<typeof runMany>[0] = []
): RunResult[] => (
	(argsNormalized = args.map(({ it, received, expected, opts }) => [it, received, expected, opts])),
	runMany(argsNormalized)
);

export const expectToError = (callbackThatShouldError: () => void): void => {
	let hasErrored: boolean = false;

	try {
		callbackThatShouldError();
	} catch (_e) {
		hasErrored = true;
	} finally {
		if (!hasErrored) {
			// eslint-disable-next-line no-unsafe-finally
			throw new Error("expected to error, but did not.");
		}
	}
};

export const noop = (..._xs: any[]): void => {
	//
};
