# Scripts

This directory contains utility scripts for the nielsshootsfilm project.

## download-sample-images.js

Downloads sample images from picsum.photos and saves them locally to ensure consistent images across development environments.

**Usage:**

```bash
node scripts/download-sample-images.js
```

**What it does:**

1. Reads `data/albums.json` to find photos with picsum.photos URLs
2. Downloads each image in three sizes:
   - Original (1920x1080)
   - Display (1200x800)
   - Thumbnail (400x300)
3. Saves images to `static/uploads/{originals,display,thumbnails}/`
4. Updates `albums.json` to point to local `/uploads/` paths
5. Updates file sizes to reflect actual downloaded sizes

**Why:**

Picsum.photos returns random images on each request. By downloading and caching them locally, we ensure:

- Consistent images across all developers
- No external dependencies during development
- Faster page loads (no external HTTP requests)
- Ability to work offline

**Note:** This script should be run once during initial setup, or whenever you want to refresh the sample images.
