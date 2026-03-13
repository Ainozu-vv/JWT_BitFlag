const bcrypt = require('bcryptjs');

/**
 * @param {string} plain
 */
async function hashPassword(plain) {
	const saltRounds = 10;
	return bcrypt.hash(plain, saltRounds);
}

/**
 * @param {string} plain
 * @param {string} hash
 */
async function verifyPassword(plain, hash) {
	return bcrypt.compare(plain, hash);
}

module.exports = { hashPassword, verifyPassword };
