#!/usr/bin/env ts-node-dev

import { runMany, expectToError } from "jest-sucks";

runMany([
	// [ //
	// ],
]);

expectToError(() => {
	throw new Error();
});
