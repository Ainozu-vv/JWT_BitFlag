const jwt = require('jsonwebtoken');

/**
 * @typedef {Object} JwtUserClaims
 * @property {string} sub user id
 * @property {string} username
 * @property {number} permissions bitmask
 */

/**
 * @param {import('../config').env} env
 * @param {{ userId: string, username: string, permissions: number }} user
 */
function signAccessToken(env, user) {
	/** @type {JwtUserClaims} */
	const payload = {
		sub: user.userId,
		username: user.username,
		permissions: user.permissions,
	};

	return jwt.sign(payload, env.jwtSecret, {
		issuer: env.jwtIssuer,
		audience: env.jwtAudience,
		expiresIn: env.jwtExpiresIn,
	});
}

/**
 * @param {import('../config').env} env
 * @param {string} token
 * @returns {JwtUserClaims}
 */
function verifyAccessToken(env, token) {
	const decoded = jwt.verify(token, env.jwtSecret, {
		issuer: env.jwtIssuer,
		audience: env.jwtAudience,
	});

	if (!decoded || typeof decoded !== 'object') {
		throw new Error('Invalid token payload');
	}

	const sub = decoded.sub;
	if (typeof sub !== 'string' || !sub) throw new Error('Invalid token subject');

	const username = decoded.username;
	const permissions = decoded.permissions;

	if (typeof username !== 'string') throw new Error('Invalid token username');
	if (typeof permissions !== 'number') throw new Error('Invalid token permissions');

	return /** @type {any} */ (decoded);
}

module.exports = { signAccessToken, verifyAccessToken };
