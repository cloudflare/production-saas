// eat "ExperimentalWarning" messages
let original = process.emitWarning.bind(process);
process.emitWarning = function (...args) {
	if (args[1] === 'ExperimentalWarning') return;
	// @ts-ignore - type overloading mismatch
	original(...args);
}
