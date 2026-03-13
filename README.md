# Express + JWT + jogosultság (bitflag) demo

Oktatási célú, minimál Express API projekt:
- JWT access token (aláírás + ellenőrzés)
- bejelentkezés / regisztráció (in-memory user store)
- jogosultságok bitflag (OR/AND/NOT műveletek)
- middleware alapú védelem (auth + permission guard)

## Követelmények
- Node.js 18+ (a `node --watch` miatt)

## Telepítés
```bash
npm install
```

## Konfiguráció
Másold a példát:
```bash
cp .env.example .env
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
TOKEN=$(curl -s http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}' | node -p "JSON.parse(require('fs').readFileSync(0,'utf8')).accessToken")

echo $TOKEN
```

### Protected
```bash
curl http://localhost:3000/demo/protected \
  -H "Authorization: Bearer $TOKEN"
```

### Admin endpoint
```bash
curl http://localhost:3000/demo/admin \
  -H "Authorization: Bearer $TOKEN"
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
  -H "Authorization: Bearer $TOKEN"
```

### Jogosultság módosítása bitflaggel (ADMIN kell)
Példa: add `USER_WRITE`, remove `USER_READ`:
```bash
USER_ID=<ide-az-id>

curl -X PATCH http://localhost:3000/users/$USER_ID/permissions \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"add":["USER_WRITE"],"remove":["USER_READ"]}'
```

## Megjegyzés
Ez a projekt szándékosan DB nélküli (in-memory), hogy a JWT + jogosultság logikára tudj fókuszálni.
