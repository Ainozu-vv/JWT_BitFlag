const express = require('express');

const { requireAuth, requirePermissions } = require('../auth/middleware');
const { Permissions, namesFromMask } = require('../auth/permissions');

const router = express.Router();

router.get('/public', (req, res) => {
	res.json({ ok: true, message: 'public endpoint' });
});

router.get('/protected', requireAuth, (req, res) => {
	res.json({
		ok: true,
		message: 'protected endpoint',
		user: {
			id: req.user.id,
			username: req.user.username,
			permissions: req.user.permissions,
			permissionNames: namesFromMask(req.user.permissions),
		},
	});
});

router.get('/admin', requireAuth, requirePermissions(Permissions.ADMIN), (req, res) => {
	res.json({ ok: true, message: 'admin endpoint', user: { username: req.user.username } });
});

module.exports = router;
