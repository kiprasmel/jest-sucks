import fs from "fs";
import path from "path";

export type Opts = { log?: 0 | 1 | 2 | 3; not?: boolean };

export type RunResult = { passed: boolean; it: string; received: string; expected: string; opts: Opts };

export const run = (
	it: string,
	received: string, //
	expected: string,
	opts: Opts = {}
): RunResult => {
	const { log = 1, not = false } = opts;

	const passed: boolean = received === expected || not;

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

export const runMany = (
	// TODO Opts as (conditional) second arg
	args: [string, string, string, Opts?][],  // TODO ESLINT
	// args: any[], //
	runResults: RunResult[] = [],
	passedRunResults: RunResult[] = [],
	failedRunResults: RunResult[] = [],
	failedResultFilePath: string = path.join(process.cwd(), "test-results.failed.json")
): typeof runResults => (
	(runResults = args.map(([it, expected, received, opts]) => run(it, received, expected, opts))),
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
		? fs.writeFileSync(failedResultFilePath, JSON.stringify(failedRunResults, null, 2))
		: fs.existsSync(failedResultFilePath) && fs.rmSync(failedResultFilePath),
	failedRunResults.length && console.log(failedResultFilePath, "\n\n\n"),
	failedRunResults.length && process.exit(1),
	runResults
);

export const runManyWithVerboseArgs = (
	args: { it: string; received: string; expected: string; opts?: Opts }[],
	argsNormalized: Parameters<typeof runMany>[0] = []
): RunResult[] => (
	(argsNormalized = args.map(({ it, expected, received, opts }) => [it, expected, received, opts])),
	runMany(argsNormalized)
);

