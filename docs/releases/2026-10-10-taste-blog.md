# Blog taste redesign release — 2026-10-10

User approved the reviewed design and requested direct production publication.

## Published version

- Site: https://www.harvey404.com/
- Published at: 2026-10-10 11:18:14 +08:00.
- Source: `f81544beca65c6a35bc8f772887777174ec76bf5` on `feat/taste-blog-redesign`.
- Runtime image: `taste-web:20261010-f81544b`.
- Image ID: `sha256:03b70448fa3ab57db6c7cb7f3c9b8f6a203fd43c5c58efccb42c0158b640f543`.
- Release directory: `/opt/digital-garden/releases/20261010-taste-blog-f81544b`.

The frontend was built locally with the existing production public map settings, then packaged as a versioned image using a snapshot of the previous running frontend. Existing hashed assets remain available for already-open browser sessions. Nginx configuration, HTTPS certificates and upstream routes were preserved. Backend and MySQL container IDs remained unchanged. The existing dirty server source checkout was preserved; the release retains an exact source archive for reproducibility.

## Verification

- Production build and lint succeeded. Lint retains 17 existing warnings.
- Candidate Nginx configuration, root checksum and API health passed before replacement.
- All 304 uploaded production files match their build checksums.
- HTTPS root HTML matches SHA-256 `ef536ebbf6cb446fea0c6256e04d86f449dc325a19caa2fe030e00e57e559196`.
- HTTP 200: `/`, `/posts`, `/projects`, `/about`, `/posts/custom-behavior-tracker`, `/tracker`, `/tracker/`, `/tracker/demo/`, `/ledger/login`, `/album`, `/diet/`, `/sunzi/`, `/api/health`, `/robots.txt`.
- Public browser checks: real articles load, 地图 search returns one article, article contents scroll correctly, theme switching works.
- Mobile browser: navigation opens, follows About and closes automatically; About content has no horizontal overflow and its portrait loads.
- No authentication, comments, likes or financial writes were submitted during verification. Article read counters can increase through the existing GET behavior.

## Runtime commands

Run on the existing `aliyun-dg` SSH host. The release Compose override pins both the current server image and this frontend image.

```bash
sudo docker compose -p deploy \
  --env-file /opt/digital-garden/deploy/.env \
  -f /opt/digital-garden/deploy/docker-compose.yml \
  -f /opt/digital-garden/releases/20261010-taste-blog-f81544b/release.override.yml \
  up -d --no-deps --no-build --pull never web
```

Rollback uses the exact previous running frontend snapshot:

```bash
sudo bash /opt/digital-garden/releases/20261010-taste-blog-f81544b/rollback.sh
```

Local review screenshots and reports remain under `review/taste-2026-10-10/` and are excluded from the production build output.
