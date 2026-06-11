# worldcup

FIFA 2026 World Cup pickem, focused on the LA matches.

Live at https://worldcup.makeacompany.ai (once first tag ships).

## Layout

- `frontend/` — Next.js 16 app (App Router, TS, Tailwind v4)
- `deploy/docker/frontend.Dockerfile` — multi-stage build (`development` and `production` targets)
- `.github/workflows/worldcup-images.yml` — builds on tag, calls the BimRoss gitops-release reusable workflow

## Local dev

```sh
cd frontend
npm install
npm run dev
```

## Release

Push a tag `v0.X.Y` from `main`. The workflow builds and pushes `geeemoney/worldcup:0.X.Y`, then opens an auto-PR against `BimRoss/rancher-admin` to bump the manifest. Merge that PR and Fleet rolls it.
