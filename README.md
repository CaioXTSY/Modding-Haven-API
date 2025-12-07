<p align="center">
  <a href="https://nestjs.com" target="_blank">
    <img src="https://nestjs.com/img/logo-small.svg" width="100" alt="NestJS Logo" />
  </a>
</p>

# Modding Haven API

NestJS API for publishing and managing game mods, with JWT auth, images, versions/files, admin approval, and public search. Swagger docs available.

## Requirements
- Node.js 18+
- MySQL/MariaDB (`DATABASE_URL`)

## Install
```bash
npm install
```

## Environment
Create `.env` with:
```env
DATABASE_URL="mysql://user:pass@host:3306/dbname"
PORT=3000
JWT_SECRET="replace-with-a-secret"
```

## Database (Prisma)
Generate client after schema changes:
```bash
npx prisma generate
```

## Scripts
- `npm run start:dev` — dev server (watch)
- `npm run build` — compile
- `npm run start` — run compiled
- `npm run lint` — ESLint
- `npm run test` — Jest

## Run
```bash
npm run start:dev
```
Open Swagger at `http://localhost:3000/docs`.

## Key Features
- Mods: create, update, list with pagination/filters
- Images: upload/delete (5MB; `.jpg`, `.jpeg`, `.png`, `.webp`)
- Versions & Files: upload/delete (500MB; `.zip`, `.rar`, `.asi`, `.cleo`; `primary` file)
- Admin approval: approve/reject with rules
- Search: public fuzzy match on name/description

## Core Endpoints
- Mods: `POST /mods`, `GET /mods`, `GET /mods/:slug`, `PATCH /mods/:slug`, `DELETE /mods/:slug`
- Images: `POST /mods/:slug/images`, `DELETE /mods/:slug/images/:id`
- Versions: `POST /mods/:slug/versions`, `GET /mods/:slug/versions`, `DELETE /mods/:slug/versions/:id`
- Version Files: `POST /mods/:slug/versions/:versionId/files`, `DELETE /mods/:slug/versions/:versionId/files/:fileId`
- Admin: `GET /admin/mods/pending`, `POST /admin/mods/:id/approve`, `POST /admin/mods/:id/reject`
- Search: `GET /search?q=` returns items with `thumbnail`

## Approval Rules (Admin)
A mod is approved only if it has:
- ≥ 1 screenshot
- ≥ 1 version
- ≥ 1 file inside the version

## Uploads
Files are stored under `uploads/`. Public URLs are returned as `/uploads/<path>`.
