const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');

/**
 * @typedef {Object} JwtUserClaims
 * @property {string} sub user id
 * @property {string} username
 * @property {number} permissions bitmask
 * @property {'access'|'refresh'} tokenUse
 * @property {string} jti
 * @property {number} exp
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
		tokenUse: 'access',
	};

	return jwt.sign(payload, env.jwtSecret, {
		issuer: env.jwtIssuer,
		audience: env.jwtAudience,
		expiresIn: env.jwtExpiresIn,
		jwtid: randomUUID(),
	});
}

/**
 * @param {import('../config').env} env
 * @param {{ userId: string, username: string, permissions: number }} user
 */
function signRefreshToken(env, user) {
	/** @type {JwtUserClaims} */
	const payload = {
		sub: user.userId,
		username: user.username,
		permissions: user.permissions,
		tokenUse: 'refresh',
	};

	return jwt.sign(payload, env.jwtSecret, {
		issuer: env.jwtIssuer,
		audience: env.jwtAudience,
		expiresIn: env.jwtRefreshExpiresIn,
		jwtid: randomUUID(),
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
	const tokenUse = decoded.tokenUse;
	const jti = decoded.jti;
	const exp = decoded.exp;

	if (typeof username !== 'string') throw new Error('Invalid token username');
	if (typeof permissions !== 'number') throw new Error('Invalid token permissions');
	if (tokenUse !== 'access') throw new Error('Invalid token use');
	if (typeof jti !== 'string' || !jti) throw new Error('Invalid token id');
	if (typeof exp !== 'number') throw new Error('Invalid token exp');

	return /** @type {any} */ (decoded);
}

/**
 * @param {import('../config').env} env
 * @param {string} token
 * @returns {JwtUserClaims}
 */
function verifyRefreshToken(env, token) {
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
	const tokenUse = decoded.tokenUse;
	const jti = decoded.jti;
	const exp = decoded.exp;

	if (typeof username !== 'string') throw new Error('Invalid token username');
	if (typeof permissions !== 'number') throw new Error('Invalid token permissions');
	if (tokenUse !== 'refresh') throw new Error('Invalid token use');
	if (typeof jti !== 'string' || !jti) throw new Error('Invalid token id');
	if (typeof exp !== 'number') throw new Error('Invalid token exp');

	return /** @type {any} */ (decoded);
}

module.exports = { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken };
