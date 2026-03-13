const { randomUUID } = require('crypto');

const { readJson, writeJsonAtomic } = require('./jsonDb');

const USERS_FILE = 'users.json';

function loadDb() {
	return readJson(USERS_FILE, { users: [] });
}

/**
 * @param {{ users: Array<any> }} db
 */
function saveDb(db) {
	writeJsonAtomic(USERS_FILE, db);
}

function createUser(input) {
	const db = loadDb();
	const normalized = input.username.trim().toLowerCase();
	if (!normalized) throw new Error('Username required');
	if (db.users.some((u) => u.username === normalized)) throw new Error('Username already exists');

	const user = {
		id: randomUUID(),
		username: normalized,
		passwordHash: input.passwordHash,
		permissions: input.permissions,
	};

	db.users.push(user);
	saveDb(db);

	return { ...user };
}

function findByUsername(username) {
	const db = loadDb();
	const normalized = username.trim().toLowerCase();
	const user = db.users.find((u) => u.username === normalized);
	return user ? { ...user } : null;
}

function findById(id) {
	const db = loadDb();
	const user = db.users.find((u) => u.id === id);
	return user ? { ...user } : null;
}

function listUsers() {
	const db = loadDb();
	return db.users.map((u) => ({ ...u }));
}

function setPermissions(id, permissions) {
	const db = loadDb();
	const idx = db.users.findIndex((u) => u.id === id);
	if (idx === -1) return null;
	const updated = { ...db.users[idx], permissions };
	db.users[idx] = updated;
	saveDb(db);
	return { ...updated };
}

function setPasswordHash(id, passwordHash) {
	const db = loadDb();
	const idx = db.users.findIndex((u) => u.id === id);
	if (idx === -1) return null;
	const updated = { ...db.users[idx], passwordHash };
	db.users[idx] = updated;
	saveDb(db);
	return { ...updated };
}

function deleteUser(id) {
	const db = loadDb();
	const idx = db.users.findIndex((u) => u.id === id);
	if (idx === -1) return false;
	db.users.splice(idx, 1);
	saveDb(db);
	return true;
}

module.exports = { createUser, findByUsername, findById, listUsers, setPermissions, setPasswordHash, deleteUser };
