# Express + JWT + jogosultság (bitflag) demo

Oktatási célú, minimál Express API projekt:
- JWT access token (aláírás + ellenőrzés)
- bejelentkezés / regisztráció (in-memory user store)
- jogosultságok bitflag (OR/AND/NOT műveletek)
- middleware alapú védelem (auth + permission guard)

## Követelmények
- Node.js 18+

## Telepítés
```bash
npm install
```

## Konfiguráció
Másold a példát:
```bash
cp .env.example .env
```

Perzisztencia:
- A projekt JSON fájlokba ment `data/` alá (userek + tokenek), így újraindítás után is megmaradnak.
- A `data/*.json` alapból gitignored.

Adatok nullázása (demóhoz):
```bash
npm run reset-data
```

Fejlesztéshez a `JWT_SECRET` hiánya esetén is fut (default: `dev-secret-change-me`), de prod módban kötelező.

## Futtatás
Fejlesztő módban:
```bash
npm run dev
```

Éles-szerűen:
```bash
npm start
```

Induláskor seedel egy admin usert oktatáshoz:
- username: `admin`
- password: `admin123`

További seed userek:
- username: `readuser` / password: `readuser123` (csak `USER_READ`)
- username: `writeuser` / password: `writeuser123` (`USER_READ` + `USER_WRITE`)

## Jogosultságok (bitflag)
A bitek a [src/auth/permissions.js](src/auth/permissions.js) fájlban vannak:
- `ADMIN`
- `USER_READ`
- `USER_WRITE`

A bitműveletek lényege:
- hozzáadás: `mask | FLAG`
- elvétel: `mask & ~FLAG`
- ellenőrzés (minden kell): `(mask & required) === required`

## Gyors teszt (curl)
### Public
```bash
curl http://localhost:3000/demo/public
```

### Login (admin)
```bash
ACCESS_TOKEN=$(curl -s http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}' | node -p "JSON.parse(require('fs').readFileSync(0,'utf8')).accessToken")

REFRESH_TOKEN=$(curl -s http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}' | node -p "JSON.parse(require('fs').readFileSync(0,'utf8')).refreshToken")

echo $ACCESS_TOKEN
echo $REFRESH_TOKEN
```

### Protected
```bash
curl http://localhost:3000/demo/protected \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Admin endpoint
```bash
curl http://localhost:3000/demo/admin \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### USER_WRITE endpoint
```bash
curl http://localhost:3000/demo/write \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Regisztráció
```bash
curl -s http://localhost:3000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"alice","password":"alice123"}'
```

### Userek listázása (ADMIN kell)
```bash
curl http://localhost:3000/users \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Jogosultság módosítása bitflaggel (ADMIN kell)
Példa: add `USER_WRITE`, remove `USER_READ`:
```bash
USER_ID=<ide-az-id>

curl -X PATCH http://localhost:3000/users/$USER_ID/permissions \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"add":["USER_WRITE"],"remove":["USER_READ"]}'
```

### /auth/me
```bash
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Refresh token rotáció (/auth/refresh)
```bash
curl -s http://localhost:3000/auth/refresh \
  -H 'Content-Type: application/json' \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}"
```

### Logout (/auth/logout)
```bash
curl -s -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## OpenAPI
OpenAPI JSON: `GET /openapi.json`

## Megjegyzés
Ez a projekt szándékosan DB nélküli (in-memory), hogy a JWT + jogosultság logikára tudj fókuszálni.
