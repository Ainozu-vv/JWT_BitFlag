const { randomUUID } = require('crypto');

const { readJson, writeJsonAtomic } = require('./jsonDb');

const TOKENS_FILE = 'tokens.json';

// In-memory token store (demo only)

/**
 * refreshTokenId (jti) -> record
 * record: { userId, expiresAt, revokedAt?, replacedBy? }
 */
const refreshTokensById = new Map();

/**
 * accessTokenId (jti) -> expiresAt (unix seconds)
 */
const revokedAccessTokens = new Map();

function loadFromDisk() {
	const db = readJson(TOKENS_FILE, { refreshTokensById: {}, revokedAccessTokens: {} });

	refreshTokensById.clear();
	for (const [id, rec] of Object.entries(db.refreshTokensById ?? {})) {
		refreshTokensById.set(id, rec);
	}

	revokedAccessTokens.clear();
	for (const [id, exp] of Object.entries(db.revokedAccessTokens ?? {})) {
		revokedAccessTokens.set(id, Number(exp));
	}
}

function persistToDisk() {
	/** @type {{ refreshTokensById: Record<string, any>, revokedAccessTokens: Record<string, any> }} */
	const db = {
		refreshTokensById: Object.fromEntries(refreshTokensById.entries()),
		revokedAccessTokens: Object.fromEntries(revokedAccessTokens.entries()),
	};
	writeJsonAtomic(TOKENS_FILE, db);
}

loadFromDisk();

function nowSeconds() {
	return Math.floor(Date.now() / 1000);
}

/**
 * @param {string} refreshTokenId
 * @param {string} userId
 * @param {number} expiresAtSeconds
 */
function storeRefreshToken(refreshTokenId, userId, expiresAtSeconds) {
	refreshTokensById.set(refreshTokenId, {
		userId,
		expiresAt: expiresAtSeconds,
	});
	persistToDisk();
}

/**
 * @param {string} refreshTokenId
 */
function getRefreshToken(refreshTokenId) {
	return refreshTokensById.get(refreshTokenId) ?? null;
}

/**
 * @param {string} refreshTokenId
 */
function isRefreshTokenActive(refreshTokenId) {
	const rec = refreshTokensById.get(refreshTokenId);
	if (!rec) return false;
	if (rec.revokedAt) return false;
	return rec.expiresAt > nowSeconds();
}

/**
 * @param {string} refreshTokenId
 * @param {{ replacedBy?: string }=} opts
 */
function revokeRefreshToken(refreshTokenId, opts) {
	const rec = refreshTokensById.get(refreshTokenId);
	if (!rec) return false;
	if (rec.revokedAt) return true;
	refreshTokensById.set(refreshTokenId, {
		...rec,
		revokedAt: nowSeconds(),
		...(opts?.replacedBy ? { replacedBy: opts.replacedBy } : {}),
	});
	persistToDisk();
	return true;
}

/**
 * Rotate refresh token: old becomes revoked and points to new.
 * @param {string} oldRefreshTokenId
 * @param {string} newRefreshTokenId
 * @param {number} newExpiresAtSeconds
 */
function rotateRefreshToken(oldRefreshTokenId, newRefreshTokenId, newExpiresAtSeconds) {
	const oldRec = refreshTokensById.get(oldRefreshTokenId);
	if (!oldRec) return false;
	revokeRefreshToken(oldRefreshTokenId, { replacedBy: newRefreshTokenId });
	storeRefreshToken(newRefreshTokenId, oldRec.userId, newExpiresAtSeconds);
	return true;
}

/**
 * @param {string} userId
 */
function revokeAllRefreshTokensForUser(userId) {
	for (const [id, rec] of refreshTokensById.entries()) {
		if (rec.userId !== userId) continue;
		revokeRefreshToken(id);
	}
}

/**
 * @param {string} accessTokenId
 * @param {number} expiresAtSeconds
 */
function revokeAccessToken(accessTokenId, expiresAtSeconds) {
	revokedAccessTokens.set(accessTokenId, expiresAtSeconds);
	persistToDisk();
}

/**
 * @param {string} accessTokenId
 */
function isAccessTokenRevoked(accessTokenId) {
	const exp = revokedAccessTokens.get(accessTokenId);
	if (!exp) return false;
	if (exp <= nowSeconds()) {
		revokedAccessTokens.delete(accessTokenId);
		persistToDisk();
		return false;
	}
	return true;
}

/**
 * @param {number} count
 */
function generateTokenIds(count) {
	return Array.from({ length: count }, () => randomUUID());
}

module.exports = {
	storeRefreshToken,
	getRefreshToken,
	isRefreshTokenActive,
	revokeRefreshToken,
	rotateRefreshToken,
	revokeAllRefreshTokensForUser,
	revokeAccessToken,
	isAccessTokenRevoked,
	generateTokenIds,
};
