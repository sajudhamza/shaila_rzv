# Shaila Rizvi

Static clone of [shailarizvi.com](https://www.shailarizvi.com/) with a studio admin layer for adding projects.

## Run

```bash
npm install
npm run dev
```

## Studio login (add projects)

1. Open the site and click **Login** (bottom right)
2. Password: `ShailaRizvi2026!` (or set `SHAILA_ADMIN_PASSWORD` in `.env`)
3. Guided flow:
   - Project name
   - Description
   - Project images
   - Journal images (+ optional captions)
   - Review & publish

## Project folders (drop images here)

Every case study has a folder. Put photos in `images/` (gallery + home cover) or `journal/` (process shots). Refresh the site to see them.

- `public/cms-projects/bungalow/`
- `public/cms-projects/chote-miya/`
- `public/cms-projects/gupshup/`
- `public/cms-projects/ammi/`
- `public/cms-projects/movie/`
- `public/cms-projects/punjab-meet-house/`

Also stored as:

- `public/cms-projects/projects.json`
- `public/cms-projects/{slug}/index.html` (case study page)

They appear in the home **Case Study** section and **All Case Studies** list.

## Pages

- `/`: Home
- `/desing-cms/bungalow/`: Bungalow
- `/desing-cms/chote-miya/`: Chote Miya
- `/desing-cms/gupshup/`: GupShup
- `/desing-cms/ammi/`: Ammi
- `/desing-cms/movie/`: Zindagi Kashmakash
- `/cms-projects/{slug}/`: Projects you add via Login
