# Realty Roulette

Realty Roulette is a static web game where players guess the listing price of active Redfin homes across a national mode and a 51-state challenge mode.

## Production Files

Deploy these files to your static host:

- `index.html`
- `app.js`
- `base.css`
- `style.css`
- `gameData.json`

Build helpers that do not need to be deployed:

- `build_realty_data.py`
- `state_games_cache.json`
- `__pycache__/`
- local backup folders

## Local Preview

Run:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://127.0.0.1:8000
```

## Rebuild Listing Data

If you need to regenerate the dataset:

```bash
python3 -u build_realty_data.py
```

This rebuilds `gameData.json` and refreshes `state_games_cache.json`.

## Editing And Iterating

For quick manual edits:

- Edit [gameData.json](/Users/colinlowe/Downloads/Price It Right (1)/gameData.json) directly
- Each round is a plain object with fields like `mainPhoto`, `extraPhotos`, `price`, `address`, `city`, `state`, `beds`, `baths`, and `sqft`
- National games live under `games`
- State challenges live under `stateGames`

For full listing refreshes or new Redfin-driven additions:

- Run `python3 -u build_realty_data.py`
- The builder reuses `state_games_cache.json` so iterative rebuilds are faster
- Important tuning values now live at the top of [build_realty_data.py](/Users/colinlowe/Downloads/Price It Right (1)/build_realty_data.py):
  - `STATE_ROUNDS_PER_GAME`
  - `NATIONAL_TOTAL_ROUNDS`
  - `MAX_STATE_CITY_REPEAT`
  - `MAX_NATIONAL_CITY_REPEAT`
  - `MAX_NATIONAL_PER_STATE`

Recommended workflow for keeping prices current:

1. Rebuild with `python3 -u build_realty_data.py`
2. Spot-check a few listings in `gameData.json`
3. Make any manual corrections directly in `gameData.json`
4. Test locally with `python3 -m http.server 8000`

## Deploy Notes

- The app is fully static and does not require environment variables.
- All asset paths are relative, so it can be hosted on Netlify, Vercel static hosting, GitHub Pages, S3, or any simple web server.
- The app stores gameplay progress, achievements, and leaderboard data in `localStorage`.
- For best results, serve with standard gzip or brotli compression enabled for `json`, `js`, and `css`.
- `.nojekyll` is included, so GitHub Pages can serve the project root cleanly.

## GitHub Pages

To publish on GitHub Pages:

1. Push this project to a GitHub repository
2. Push the repo to the `main` branch
3. In GitHub, open `Settings` -> `Pages`
4. Set the source to `GitHub Actions`
5. The included workflow at `.github/workflows/deploy-pages.yml` will deploy the site automatically on pushes to `main`

The workflow publishes only the site files, not the local backups or build helpers.
