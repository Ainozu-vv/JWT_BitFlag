const express = require('express');

const { env } = require('./config');
const { errorHandler } = require('./utils/httpError');
const authRoutes = require('./routes/auth');
const demoRoutes = require('./routes/demo');
const usersRoutes = require('./routes/users');
const { Permissions } = require('./auth/permissions');
const { hashPassword } = require('./auth/password');
const { createUser, findByUsername } = require('./store/users');
const cors = require('cors');
const openapiRoutes = require('./routes/openapi');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
	res.json({ ok: true });
});

app.use('/openapi.json', openapiRoutes);

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
		permissions: Permissions.ADMIN 
	});

	console.log('Seeded admin user: admin / admin123');
}

async function seedReadUser() {
	if (findByUsername('readuser')) return;
	const passwordHash = await hashPassword('readuser123');
	createUser({
		username: 'readuser',
		passwordHash,
		permissions: Permissions.USER_READ,
	});

	console.log('Seeded read user: readuser / readuser123');
}

async function seedWriteUser() {
	if (findByUsername('writeuser')) return;
	const passwordHash = await hashPassword('writeuser123');
	createUser({
		username: 'writeuser',
		passwordHash,
		permissions: Permissions.USER_READ | Permissions.USER_WRITE,
	});

	console.log('Seeded write user: writeuser / writeuser123');
}

seedAdmin().catch((err) => {
	console.error('Admin seed failed:', err);
});

seedReadUser().catch((err) => {
	console.error('Read user seed failed:', err);
});

seedWriteUser().catch((err) => {
	console.error('Write user seed failed:', err);
});

app.listen(env.port, () => {
	console.log(`API listening on http://localhost:${env.port}`);
});
