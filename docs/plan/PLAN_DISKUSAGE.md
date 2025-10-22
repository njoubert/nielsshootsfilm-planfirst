# Phase 1: Disk Usage Management Tracking DONE

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

## Phase 2 Additional Features DONE

- The maximum disk usage allowed in settings must be capped at 95%. Validate this input on the front-end and back-end.
- The front end should refuse to upload images if the available disk space is less than the maximum disk usage allowed in the settings.
- The back-end must use the same configuration settings to check that it will reject uploads if the upload will result in less disk space available than allowed by the maximum disk usage percentage. The back-end must also always reserve 5% of the disk to remain free regardless of the setting.

## Phase 3 Configurable limits for image upload

- Have a setting that configures the largest individual image size you can upload. Set the default to 50MBytes.
- Have the backend and the frontend both check the image size.
- Make sure the text on the upload box shows the correct value.
