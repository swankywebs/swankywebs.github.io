## Realty Roulette GitHub Pages Package

This folder contains the current publishable web app files for GitHub Pages.

### Publish steps

1. Create a GitHub repository.
2. Upload the contents of this folder to the repo root.
3. Commit to the `main` branch.
4. In GitHub, open `Settings -> Pages`.
5. Set the source to `GitHub Actions`.
6. The included workflow will deploy the site automatically.

### Included

- site files: `index.html`, `app.js`, `base.css`, `style.css`
- data: `gameData.json`
- assets: `logo.png`, `favicon-house.svg`, `venmo-qr.png`
- Pages support: `.nojekyll`, `.github/workflows/deploy-pages.yml`

### Not included

- builder scripts
- caches
- soundtrack
- old backups
- local dev artifacts
