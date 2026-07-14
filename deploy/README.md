# Web deployment (single Hetzner VPS)

The three SPAs build into tiny nginx images (see [../Dockerfile](../Dockerfile))
and run as two Compose stacks on the same VPS as the API, behind the shared
edge Caddy (`cohort-be/deploy/`), which terminates TLS via Let's Encrypt —
no certbot, no manual cert work.

| Stack    | Dir                    | Domains                                                                | Deploys on     |
| -------- | ---------------------- | ---------------------------------------------------------------------- | -------------- |
| web-prod | `/opt/cohort/web-prod` | `admin.cohort.uz`, `internal.cohort.uz`, `teach.cohort.uz`             | push to `main` |
| web-dev  | `/opt/cohort/web-dev`  | `admin-dev.cohort.uz`, `internal-dev.cohort.uz`, `teach-dev.cohort.uz` | push to `dev`  |

Caddy routes hostname → container alias (`web-admin-prod`, `web-internal-prod`,
`web-teach-prod`, `*-dev`) over the external `edge` network. The containers
publish no host ports and hold no secrets — `VITE_*` config is compile-time and
baked into the image by CI.

The app dir → image → host mapping (they deliberately differ; the image and host
follow the API *surface*, not the folder):

| App dir             | Surface       | Image                  | Prod host            |
| ------------------- | ------------- | ---------------------- | -------------------- |
| `admin`             | `/manage`     | `cohort-web-admin`     | `admin.cohort.uz`    |
| `internal-platform` | `/super-admin`| `cohort-web-internal`  | `internal.cohort.uz` |
| `teacher`           | `/teach`      | `cohort-web-teach`     | `teach.cohort.uz`    |

## 1. DNS (cohort.uz panel)

| Type | Name           | Value  | TTL |
| ---- | -------------- | ------ | --- |
| A    | `admin`        | VPS_IP | 300 |
| A    | `internal`     | VPS_IP | 300 |
| A    | `teach`        | VPS_IP | 300 |
| A    | `admin-dev`    | VPS_IP | 300 |
| A    | `internal-dev` | VPS_IP | 300 |
| A    | `teach-dev`    | VPS_IP | 300 |

The CAA record (`@ → 0 issue "letsencrypt.org"`) from the backend setup already
authorizes issuance. Verify:
`dig +short admin.cohort.uz internal.cohort.uz teach.cohort.uz`.
Certs are issued automatically by the edge Caddy once DNS resolves — until
then it retries with backoff, which is harmless.

## 2. Bootstrap the stacks (once, as `deploy`)

```bash
sudo mkdir -p /opt/cohort/{web-prod,web-dev} && sudo chown -R deploy:deploy /opt/cohort/web-prod /opt/cohort/web-dev

# on the server: create .env in each dir from .env.server.example
# (prod values vs the commented dev values), then chmod 600 .env
```

`docker-compose.web.yml` does **not** need copying — each deploy `scp`s it from this repo
before running `docker compose`, so the repo is the source of truth and the server copy can
never drift. (`.env` is deliberately *not* synced: it is server-side config.)

> **Adding a new app?** After the code + Caddyfile work, the one manual server step is adding
> `<APP>_ALIAS` (and a fallback `<APP>_IMAGE`) to the `.env` in **both** `/opt/cohort/web-prod`
> and `/opt/cohort/web-dev`. `*_ALIAS` is the Caddy upstream name and has no default — a
> missing one is not a Compose error, it just yields an empty network alias, so the deploy
> would go green while the hostname 502s forever. The deploy script now asserts every
> `*_ALIAS` is present and fails loudly instead.

## 3. Required GitHub secrets & variables (this repo)

Secrets — same values as in `cohort-be`:

| Secret           | Value                                                              |
| ---------------- | ------------------------------------------------------------------ |
| `VPS_HOST`       | server IP / hostname                                               |
| `DEPLOY_USER`    | `deploy`                                                           |
| `DEPLOY_SSH_KEY` | private key whose public half is in `~deploy/.ssh/authorized_keys` |

Variables (public, compile-time — see [../docs/environments.md](../docs/environments.md)):

| Variable          | Value                       |
| ----------------- | --------------------------- |
| `PROD_API_ORIGIN` | `https://api.cohort.uz`     |
| `DEV_API_ORIGIN`  | `https://api-dev.cohort.uz` |

```bash
gh secret set VPS_HOST        --body "VPS_IP"
gh secret set DEPLOY_USER     --body "deploy"
gh secret set DEPLOY_SSH_KEY  < path/to/private_key
gh variable set PROD_API_ORIGIN --body "https://api.cohort.uz"
gh variable set DEV_API_ORIGIN  --body "https://api-dev.cohort.uz"
```

## 4. Deploy flow

Push to `main`/`dev` → the workflow builds all three apps (Docker matrix, pushed
to GHCR as `cohort-web-admin` / `cohort-web-internal` / `cohort-web-teach`,
tagged `latest`|`dev` +
git SHA) → SSH to the VPS → `pull` + `up -d --wait`. Healthchecks plus the edge
Caddy's `lb_try_duration` retries make the ~1s container swap invisible to
users. Re-run manually (e.g. after changing a `VITE_*` variable) via
`workflow_dispatch` — Vite env is compile-time, so config changes require a
rebuild, not a server edit.

Local smoke test of the image:

```bash
docker build --build-arg APP=admin --build-arg VITE_API_ORIGIN=https://api-dev.cohort.uz -t web-admin:test .
docker run --rm -p 8080:80 web-admin:test
# http://localhost:8080 → navigate to a deep route → refresh → must NOT 404
```

## 5. Rollback

Instant — every deploy is tagged with its git SHA on GHCR:

```bash
cd /opt/cohort/web-prod
ADMIN_IMAGE=ghcr.io/<owner>/cohort-web-admin:<previous-sha> \
  docker compose -f docker-compose.web.yml up -d --no-deps --wait web-admin
# same with INTERNAL_IMAGE / web-internal and TEACH_IMAGE / web-teach
```

## 6. Verify after a deploy

```bash
for host in admin.cohort.uz internal.cohort.uz teach.cohort.uz; do
  curl -sI "https://$host" | head -1                                              # HTTP/2 200, valid LE cert
  curl -s "https://$host/some/deep/route" -o /dev/null -w "$host deep: %{http_code}\n"  # 200 (SPA fallback)
done
```

Add HTTP monitors for both prod hostnames in Uptime Kuma
(`status.cohort.uz`). Gotcha checklist for a broken first deploy: DNS not
propagated, `.env`/compose missing on the server (step 2), or the API's
`CORS_ORIGINS` missing the web origins.
