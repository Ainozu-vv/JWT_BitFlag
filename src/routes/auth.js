const express = require('express');

const { httpError } = require('../utils/httpError');
const { hashPassword, verifyPassword } = require('../auth/password');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../auth/jwt');
const { Permissions } = require('../auth/permissions');
const { env } = require('../config');
const { createUser, findByUsername, findById } = require('../store/users');
const { requireAuth } = require('../auth/middleware');
const {
	storeRefreshToken,
	isRefreshTokenActive,
	rotateRefreshToken,
	revokeRefreshToken,
	revokeAllRefreshTokensForUser,
	revokeAccessToken,
} = require('../store/tokens');
const { namesFromMask } = require('../auth/permissions');

const router = express.Router();

router.post('/register', async (req, res, next) => {
	try {
		const { username, password } = req.body ?? {};
		if (typeof username !== 'string' || typeof password !== 'string') {
			return next(httpError(400, 'username and password are required'));
		}
		if (password.length < 6) return next(httpError(400, 'password must be at least 6 chars'));

		const passwordHash = await hashPassword(password);
		const user = createUser({
			username,
			passwordHash,
			permissions: Permissions.USER_READ,
		});

		const token = signAccessToken(env, {
			userId: user.id,
			username: user.username,
			permissions: user.permissions,
		});
		const refreshToken = signRefreshToken(env, {
			userId: user.id,
			username: user.username,
			permissions: user.permissions,
		});
		const refreshClaims = verifyRefreshToken(env, refreshToken);
		storeRefreshToken(refreshClaims.jti, user.id, refreshClaims.exp);

		return res.status(201).json({
			user: { id: user.id, username: user.username, permissions: user.permissions },
			accessToken: token,
			refreshToken,
		});
	} catch (err) {
		if (String(err?.message ?? '').includes('already exists')) {
			return next(httpError(409, 'username already exists'));
		}
		return next(err);
	}
});

router.post('/login', async (req, res, next) => {
	try {
		const { username, password } = req.body ?? {};
		if (typeof username !== 'string' || typeof password !== 'string') {
			return next(httpError(400, 'username and password are required'));
		}

		const user = findByUsername(username);
		if (!user) return next(httpError(401, 'invalid credentials'));

		const ok = await verifyPassword(password, user.passwordHash);
		if (!ok) return next(httpError(401, 'invalid credentials'));

		const token = signAccessToken(env, {
			userId: user.id,
			username: user.username,
			permissions: user.permissions,
		});
		const refreshToken = signRefreshToken(env, {
			userId: user.id,
			username: user.username,
			permissions: user.permissions,
		});
		const refreshClaims = verifyRefreshToken(env, refreshToken);
		storeRefreshToken(refreshClaims.jti, user.id, refreshClaims.exp);

		return res.json({
			user: { id: user.id, username: user.username, permissions: user.permissions },
			accessToken: token,
			refreshToken,
		});
	} catch (err) {
		return next(err);
	}
});

/**
 * GET /auth/me
 */
router.get('/me', requireAuth, (req, res, next) => {
	try {
		const user = findById(req.user.id);
		if (!user) return next(httpError(404, 'User not found'));
		return res.json({
			user: {
				id: user.id,
				username: user.username,
				permissions: user.permissions,
				permissionNames: namesFromMask(user.permissions),
			},
		});
	} catch (err) {
		return next(err);
	}
});

/**
 * POST /auth/refresh
 * body: { refreshToken }
 */
router.post('/refresh', async (req, res, next) => {
	try {
		const { refreshToken } = req.body ?? {};
		if (typeof refreshToken !== 'string' || !refreshToken) {
			return next(httpError(400, 'refreshToken is required'));
		}

		const claims = verifyRefreshToken(env, refreshToken);
		if (!isRefreshTokenActive(claims.jti)) {
			return next(httpError(401, 'Refresh token revoked or expired'));
		}

		const user = findById(claims.sub);
		if (!user) {
			revokeRefreshToken(claims.jti);
			return next(httpError(401, 'Invalid refresh token'));
		}

		const nextAccessToken = signAccessToken(env, {
			userId: user.id,
			username: user.username,
			permissions: user.permissions,
		});
		const nextRefreshToken = signRefreshToken(env, {
			userId: user.id,
			username: user.username,
			permissions: user.permissions,
		});

		const nextRefreshClaims = verifyRefreshToken(env, nextRefreshToken);
		rotateRefreshToken(claims.jti, nextRefreshClaims.jti, nextRefreshClaims.exp);

		return res.json({
			accessToken: nextAccessToken,
			refreshToken: nextRefreshToken,
		});
	} catch (err) {
		return next(httpError(401, 'Invalid refresh token'));
	}
});

/**
 * POST /auth/logout
 * - Revokes the current access token (jti)
 * - Revokes all refresh tokens for the user
 */
router.post('/logout', requireAuth, (req, res, next) => {
	try {
		if (req.token?.id && typeof req.token.expiresAt === 'number') {
			revokeAccessToken(req.token.id, req.token.expiresAt);
		}

		revokeAllRefreshTokensForUser(req.user.id);
		return res.json({ ok: true });
	} catch (err) {
		return next(err);
	}
});

module.exports = router;
