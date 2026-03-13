const { randomUUID } = require('crypto');

const usersById = new Map();
const userIdByUsername = new Map();

function createUser(input) {
	const normalized = input.username.trim().toLowerCase();
	if (!normalized) throw new Error('Username required');
	if (userIdByUsername.has(normalized)) throw new Error('Username already exists');

	const user = {
		id: randomUUID(),
		username: normalized,
		passwordHash: input.passwordHash,
		permissions: input.permissions,
	};

	usersById.set(user.id, user);
	userIdByUsername.set(user.username, user.id);

	return user;
}

function findByUsername(username) {
	const normalized = username.trim().toLowerCase();
	const id = userIdByUsername.get(normalized);
	if (!id) return null;
	return usersById.get(id) ?? null;
}

function findById(id) {
	return usersById.get(id) ?? null;
}

function listUsers() {
	return Array.from(usersById.values());
}

function setPermissions(id, permissions) {
	const user = usersById.get(id);
	if (!user) return null;
	user.permissions = permissions;
	usersById.set(id, user);
	return user;
}

module.exports = { createUser, findByUsername, findById, listUsers, setPermissions };
