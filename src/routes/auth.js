const express = require('express');

const { httpError } = require('../utils/httpError');
const { hashPassword, verifyPassword } = require('../auth/password');
const { signAccessToken } = require('../auth/jwt');
const { Permissions } = require('../auth/permissions');
const { env } = require('../config');
const { createUser, findByUsername } = require('../store/users');

const router = express.Router();

/**
 * POST /auth/register
 * body: { username, password }
 */
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

		return res.status(201).json({
			user: { id: user.id, username: user.username, permissions: user.permissions },
			accessToken: token,
		});
	} catch (err) {
		if (String(err?.message ?? '').includes('already exists')) {
			return next(httpError(409, 'username already exists'));
		}
		return next(err);
	}
});

/**
 * POST /auth/login
 * body: { username, password }
 */
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

		return res.json({
			user: { id: user.id, username: user.username, permissions: user.permissions },
			accessToken: token,
		});
	} catch (err) {
		return next(err);
	}
});

module.exports = router;
