#!/usr/bin/env node

/**
 * Download sample images from picsum.photos and update albums.json
 * This ensures we always get the same images instead of random ones.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const DATA_DIR = path.join(__dirname, '..', 'data');
const STATIC_DIR = path.join(__dirname, '..', 'static', 'uploads');
const ALBUMS_JSON = path.join(DATA_DIR, 'albums.json');

// Create directories if they don't exist
const ORIGINALS_DIR = path.join(STATIC_DIR, 'originals');
const DISPLAY_DIR = path.join(STATIC_DIR, 'display');
const THUMBNAILS_DIR = path.join(STATIC_DIR, 'thumbnails');

[ORIGINALS_DIR, DISPLAY_DIR, THUMBNAILS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

/**
 * Download a file from a URL
 */
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading: ${url}`);

    const file = fs.createWriteStream(destPath);

    https
      .get(url, (response) => {
        // Follow redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          file.close();
          fs.unlinkSync(destPath);
          return downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
        }

        if (response.statusCode !== 200) {
          file.close();
          fs.unlinkSync(destPath);
          return reject(new Error(`Failed to download: ${response.statusCode}`));
        }

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          console.log(`  Saved to: ${path.basename(destPath)}`);
          resolve();
        });
      })
      .on('error', (err) => {
        file.close();
        fs.unlinkSync(destPath);
        reject(err);
      });
  });
}

/**
 * Get file size in bytes
 */
function getFileSize(filePath) {
  return fs.statSync(filePath).size;
}

/**
 * Download all images for a photo
 */
async function downloadPhotoImages(photo) {
  const downloads = [];

  // Download original
  if (photo.url_original.includes('picsum.photos')) {
    const originalPath = path.join(ORIGINALS_DIR, photo.filename_original);
    downloads.push(downloadFile(photo.url_original, originalPath));
  }

  // Download display
  if (photo.url_display.includes('picsum.photos')) {
    const displayFilename = photo.filename_original.replace('.jpg', '_display.jpg');
    const displayPath = path.join(DISPLAY_DIR, displayFilename);
    downloads.push(downloadFile(photo.url_display, displayPath));
  }

  // Download thumbnail
  if (photo.url_thumbnail.includes('picsum.photos')) {
    const thumbnailFilename = photo.filename_original.replace('.jpg', '_thumbnail.jpg');
    const thumbnailPath = path.join(THUMBNAILS_DIR, thumbnailFilename);
    downloads.push(downloadFile(photo.url_thumbnail, thumbnailPath));
  }

  await Promise.all(downloads);
}

/**
 * Update photo URLs to point to local files and update file sizes
 */
function updatePhotoUrls(photo) {
  const baseFilename = photo.filename_original.replace('.jpg', '');

  // Update URLs to local paths
  photo.url_original = `/uploads/originals/${photo.filename_original}`;
  photo.url_display = `/uploads/display/${baseFilename}_display.jpg`;
  photo.url_thumbnail = `/uploads/thumbnails/${baseFilename}_thumbnail.jpg`;

  // Update file sizes based on actual downloaded files
  const originalPath = path.join(ORIGINALS_DIR, photo.filename_original);
  const displayPath = path.join(DISPLAY_DIR, `${baseFilename}_display.jpg`);
  const thumbnailPath = path.join(THUMBNAILS_DIR, `${baseFilename}_thumbnail.jpg`);

  if (fs.existsSync(originalPath)) {
    photo.file_size_original = getFileSize(originalPath);
  }
  if (fs.existsSync(displayPath)) {
    photo.file_size_display = getFileSize(displayPath);
  }
  if (fs.existsSync(thumbnailPath)) {
    photo.file_size_thumbnail = getFileSize(thumbnailPath);
  }

  return photo;
}

/**
 * Main function
 */
async function main() {
  console.log('Starting sample image download...\n');

  // Read albums.json
  const albumsData = JSON.parse(fs.readFileSync(ALBUMS_JSON, 'utf8'));

  // Process each album
  for (const album of albumsData.albums) {
    console.log(`Processing album: ${album.title}`);

    // Download images for each photo
    for (const photo of album.photos) {
      console.log(`\n  Photo: ${photo.id}`);
      await downloadPhotoImages(photo);
      updatePhotoUrls(photo);
    }

    console.log('');
  }

  // Update last_updated timestamp
  albumsData.last_updated = new Date().toISOString();

  // Write updated albums.json
  fs.writeFileSync(ALBUMS_JSON, JSON.stringify(albumsData, null, 2));
  console.log(`Updated ${ALBUMS_JSON}`);

  console.log('\n✅ All sample images downloaded successfully!');
  console.log('\nImages saved to:');
  console.log(`  - Originals:  ${ORIGINALS_DIR}`);
  console.log(`  - Display:    ${DISPLAY_DIR}`);
  console.log(`  - Thumbnails: ${THUMBNAILS_DIR}`);
}

// Run the script
main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
