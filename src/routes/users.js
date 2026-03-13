const express = require('express');

const { requireAuth, requirePermissions } = require('../auth/middleware');
const { Permissions, PermissionNames, maskFromNames, namesFromMask, hasAll } = require('../auth/permissions');
const { httpError } = require('../utils/httpError');
const { listUsers, findById, setPermissions, deleteUser, setPasswordHash } = require('../store/users');
const { hashPassword } = require('../auth/password');

const router = express.Router();

function assertStringArray(value) {
	if (!Array.isArray(value)) return false;
	return value.every((v) => typeof v === 'string');
}

function validatePermissionNames(names) {
	for (const n of names) {
		if (!PermissionNames.includes(n)) {
			throw httpError(400, `Unknown permission: ${n}`, { allowed: PermissionNames });
		}
	}
}

// Admin-only list
router.get('/', requireAuth, requirePermissions(Permissions.ADMIN), (req, res) => {
	const users = listUsers().map((u) => ({
		id: u.id,
		username: u.username,
		permissions: u.permissions,
		permissionNames: namesFromMask(u.permissions),
	}));

	res.json({ users });
});

// Admin-only get by id
router.get('/:id', requireAuth, requirePermissions(Permissions.ADMIN), (req, res, next) => {
	const user = findById(req.params.id);
	if (!user) return next(httpError(404, 'User not found'));
	return res.json({
		user: {
			id: user.id,
			username: user.username,
			permissions: user.permissions,
			permissionNames: namesFromMask(user.permissions),
		},
	});
});

// Admin-only delete
router.delete('/:id', requireAuth, requirePermissions(Permissions.ADMIN), (req, res, next) => {
	const ok = deleteUser(req.params.id);
	if (!ok) return next(httpError(404, 'User not found'));
	return res.json({ ok: true });
});

/**
 * PATCH /users/:id/password
 * body: { password }
 * - admin OR self
 */
router.patch('/:id/password', requireAuth, async (req, res, next) => {
	try {
		const targetId = req.params.id;
		const isAdmin = hasAll(req.user.permissions, Permissions.ADMIN);
		if (!isAdmin && req.user.id !== targetId) {
			return next(httpError(403, 'Forbidden'));
		}

		const { password } = req.body ?? {};
		if (typeof password !== 'string' || password.length < 6) {
			return next(httpError(400, 'password must be at least 6 chars'));
		}

		const user = findById(targetId);
		if (!user) return next(httpError(404, 'User not found'));

		const passwordHash = await hashPassword(password);
		const updated = setPasswordHash(targetId, passwordHash);
		return res.json({
			user: {
				id: updated.id,
				username: updated.username,
				permissions: updated.permissions,
				permissionNames: namesFromMask(updated.permissions),
			},
		});
	} catch (err) {
		return next(err);
	}
});

router.patch('/:id/permissions', requireAuth, requirePermissions(Permissions.ADMIN), (req, res, next) => {
	try {
		const user = findById(req.params.id);
		if (!user) return next(httpError(404, 'User not found'));

		const body = req.body ?? {};

		if (typeof body.set === 'number') {
			const updated = setPermissions(user.id, body.set);
			return res.json({
				user: {
					id: updated.id,
					username: updated.username,
					permissions: updated.permissions,
					permissionNames: namesFromMask(updated.permissions),
				},
			});
		}

		const addNames = body.add ?? [];
		const removeNames = body.remove ?? [];

		if (!assertStringArray(addNames) || !assertStringArray(removeNames)) {
			return next(httpError(400, 'add/remove must be arrays of strings'));
		}

		validatePermissionNames(addNames);
		validatePermissionNames(removeNames);

		const addMask = maskFromNames(addNames);
		const removeMask = maskFromNames(removeNames);

		const nextMask = (user.permissions | addMask) & ~removeMask;
		const updated = setPermissions(user.id, nextMask);

		return res.json({
			user: {
				id: updated.id,
				username: updated.username,
				permissions: updated.permissions,
				permissionNames: namesFromMask(updated.permissions),
			},
		});
	} catch (err) {
		return next(err);
	}
});

module.exports = router;
