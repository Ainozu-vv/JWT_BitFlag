/**
 * Bitflag (bitmaszk) alapú jogosultságok.
 *
 * Miért így?
 * - Tömör tárolás: több jogosultság egyetlen egész számban (pl. DB-ben, JWT-ben).
 * - Gyors ellenőrzés: bitműveletekkel $O(1)$ (pl. `(mask & required) === required`).
 * - Egyszerű kombinálás: OR-ral összeadható (`ADMIN | USER_READ`), AND-del ellenőrizhető.
 *
 * Miért `1 << n`?
 * - Minden jogosultság külön bitpozíciót kap (2 hatványai), így nem fedik egymást.
 * - Példa:
 *   - `ADMIN = 1 << 0`  →  `0001`
 *   - `USER_READ = 1 << 1`  →  `0010`
 *   - `USER_WRITE = 1 << 2` →  `0100`
 *   - `ADMIN | USER_READ`   →  `0011`
 *
 * Miért `Object.freeze`?
 * - Oktatási + biztonsági ok: futásidőben ne lehessen véletlenül/rosszindulatúan átírni a konstansokat.
 *
 * Megjegyzés: JS-ben a bitműveletek 32 bites előjeles egészre konvertálnak.
 * Itt kevés flag esetén ez bőven elég; nagyon sok jogosultságnál más megoldás (pl. BigInt) kellhet.
 *
 * Használati példa:
 * - `const mask = Permissions.ADMIN | Permissions.USER_READ`
 * - `hasAll(mask, Permissions.ADMIN)` → `true`
 * - `hasAny(mask, Permissions.USER_WRITE)` → `false`
 */

/**
 * @typedef {keyof typeof Permissions} PermissionName
 */

const Permissions = Object.freeze({
	ADMIN: 1 << 0,
	USER_READ: 1 << 1,
	USER_WRITE: 1 << 2,
});

/**
 * Fix, kézzel karbantartott lista az engedély-nevekről.
 * Miért nem `Object.keys(Permissions)`?
 * - Stabil sorrend + explicit whitelisting (oktatásban és auditálhatóság szempontjából egyszerűbb).
 * - Nem függ a futásidőbeli objektum-manipulációtól.
 *
 * @type {ReadonlyArray<PermissionName>}
 */
const PermissionNames = Object.freeze((['ADMIN', 'USER_READ', 'USER_WRITE']));

/**
 * @param {number} mask
 * @param {number} required
 */
function hasAll(mask, required) {
	return (mask & required) === required;
}

/**
 * @param {number} mask
 * @param {number} flag
 */
function hasAny(mask, flag) {
	return (mask & flag) !== 0;
}

/**
 * Nevek listájából bitmaszkot készít.
 * Ismeretlen nevek esetén "csendben" kihagyja őket (nem dob hibát), hogy robusztus legyen API inputra.
 *
 * @param {Array<PermissionName | string>} names
 */
function maskFromNames(names) {
	return names.reduce((acc, name) => {
		if (!Object.prototype.hasOwnProperty.call(Permissions, name)) return acc;
		return acc | Permissions[name];
	}, 0);
}

/**
 * @param {number} mask
 */
function namesFromMask(mask) {
	return PermissionNames.filter((n) => hasAny(mask, Permissions[n]));
}

module.exports = { Permissions, PermissionNames, hasAll, hasAny, maskFromNames, namesFromMask };
