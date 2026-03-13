const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', '..', 'data');

function ensureDataDir() {
	fs.mkdirSync(dataDir, { recursive: true });
}

/**
 * @param {string} fileName
 */
function getDataPath(fileName) {
	return path.join(dataDir, fileName);
}

/**
 * @template T
 * @param {string} fileName
 * @param {T} defaultValue
 * @returns {T}
 */
function readJson(fileName, defaultValue) {
	ensureDataDir();
	const filePath = getDataPath(fileName);
	try {
		const raw = fs.readFileSync(filePath, 'utf8');
		if (!raw) return defaultValue;
		return JSON.parse(raw);
	} catch (err) {
		if (err && (err.code === 'ENOENT' || err.code === 'ENOTDIR')) return defaultValue;
		throw err;
	}
}

/**
 * Atomic-ish write: write to tmp then rename.
 * @param {string} fileName
 * @param {any} data
 */
function writeJsonAtomic(fileName, data) {
	ensureDataDir();
	const filePath = getDataPath(fileName);
	const tmpPath = `${filePath}.tmp`;
	fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
	fs.renameSync(tmpPath, filePath);
}

module.exports = { readJson, writeJsonAtomic, getDataPath };
