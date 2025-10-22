# Disk Usage Management Tracking

## Disk Space Management

- In the Go backend, check Available Space Before Accepting Upload.
- In the Go backend, throw an error if an upload will exceeds the allowed available space as set in settings.
- Display the disk space in good human-readable format. show it in the most reasonable unit, and use two decimal points. (eg. 1.02TB or 154.25GB)

## Admin Dashboard

- Show a disk space warning if we are within 10% of the allowed maximum (or over!)
- [ ] Storage statistics
  - Total storage used
  - Storage by type (originals, display, thumbnails)
  - Number of albums, photos

## Admin Settings

- [ ] Storage Configuration
  - Maximum Disk Usage Percentage (80% by default)

## Admin Album Edit

- In the "Drag photos here" box, show the current free disk space
