const express = require('express');

const { env } = require('./config');
const { errorHandler } = require('./utils/httpError');
const authRoutes = require('./routes/auth');
const demoRoutes = require('./routes/demo');
const usersRoutes = require('./routes/users');
const { Permissions } = require('./auth/permissions');
const { hashPassword } = require('./auth/password');
const { createUser, findByUsername } = require('./store/users');

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
	res.json({ ok: true });
});

app.use('/auth', authRoutes);
app.use('/demo', demoRoutes);
app.use('/users', usersRoutes);

app.use(errorHandler);

async function seedAdmin() {
	if (findByUsername('admin')) return;
	//NOTE: In a production system, you would want to handle this differently.
	const passwordHash = await hashPassword('admin123');
	createUser({
		username: 'admin',
		passwordHash,
		permissions: Permissions.ADMIN | Permissions.USER_READ | Permissions.USER_WRITE,
	});

	console.log('Seeded admin user: admin / admin123');
}

seedAdmin().catch((err) => {
	console.error('Admin seed failed:', err);
});

app.listen(env.port, () => {
	console.log(`API listening on http://localhost:${env.port}`);
});
