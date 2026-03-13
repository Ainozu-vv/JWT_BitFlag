const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const files = ['users.json', 'tokens.json'];

let removed = 0;

for (const name of files) {
	const p = path.join(dataDir, name);
	try {
		fs.unlinkSync(p);
		removed += 1;
		process.stdout.write(`Removed ${p}\n`);
	} catch (err) {
		if (err && err.code === 'ENOENT') continue;
		throw err;
	}
}

process.stdout.write(`Done. Removed ${removed} file(s).\n`);
