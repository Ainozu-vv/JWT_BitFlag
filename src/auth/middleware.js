const { httpError } = require('../utils/httpError');
const { verifyAccessToken } = require('./jwt');
const { hasAll, namesFromMask } = require('./permissions');
const { env } = require('../config');


function getBearerToken(req) {
	const header = req.headers.authorization;
	if (!header) return null;

	const [scheme, token] = header.split(' ');
	if (scheme !== 'Bearer' || !token) return null;
	return token;
}

function requireAuth(req, res, next) {
	try {
		const token = getBearerToken(req);
		if (!token) return next(httpError(401, 'Missing Bearer token'));

		const claims = verifyAccessToken(env, token);

		req.user = /** @type {AuthUser} */ ({
			id: claims.sub,
			username: claims.username,
			permissions: claims.permissions,
		});

		return next();
	} catch (err) {
		return next(httpError(401, 'Invalid or expired token'));
	}
}

function requirePermissions(requiredMask) {
	return (req, res, next) => {
		const user = req.user;
		if (!user) return next(httpError(401, 'Not authenticated'));

		if (!hasAll(user.permissions, requiredMask)) {
			return next(
				httpError(403, 'Missing permissions', {
					required: namesFromMask(requiredMask),
					have: namesFromMask(user.permissions),
				}),
			);
		}

		return next();
	};
}

module.exports = { requireAuth, requirePermissions };
