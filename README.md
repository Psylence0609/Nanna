# Nanna Retirement Tribute

A family-first retirement tribute website built with React, Vite, Tailwind, shadcn-style components, and anime-js.

## Edit The Tribute

- Text, timeline entries, captions, and messages live in `src/content/tribute.ts`.
- Photos live in `public/photos/`.
- Replace the placeholder PNGs with family photos, or add new files and update the `src` values in `tribute.ts`.

## Run Locally

```powershell
$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')
npm.cmd install
npm.cmd run dev
```

## Deploy To GitHub Pages

Push this repo to GitHub with the default branch named `main`. The workflow in `.github/workflows/deploy.yml` builds the site and deploys `dist` to GitHub Pages.
