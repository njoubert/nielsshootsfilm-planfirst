# Open Graph Image Implementation

## Overview

This implementation adds Open Graph meta tags to the website, enabling rich preview cards when the site is shared on social media platforms (Facebook, Twitter, LinkedIn, etc.).

## How It Works

1. **Static Meta Tags**: The `index.html` file contains Open Graph and Twitter Card meta tags that point to `/og-image` endpoint.

2. **Dynamic Image Endpoint**: A backend endpoint `/og-image` serves the cover image from the main portfolio album.

3. **Fallback Logic**: The handler implements graceful fallbacks:
   - First, tries to serve the cover photo of the main portfolio album
   - Falls back to the first photo if no cover is set
   - Falls back to the first public album if no main album is configured
   - Returns 404 if no photos are available

## Files Modified

- `frontend/src/index.html` - Added Open Graph and Twitter Card meta tags
- `backend/internal/handlers/og_image_handler.go` - Created handler for `/og-image` endpoint
- `backend/cmd/admin/main.go` - Added route for `/og-image`
- `frontend/vite.config.ts` - Added proxy configuration for development

## Testing

### Manual Testing

1. Start the backend server:
   ```bash
   ./dev.sh backend start
   ```

2. Access the endpoint directly:
   ```bash
   curl -I http://localhost:8080/og-image
   ```
   Should return `200 OK` with image content.

3. Test with social media debugging tools:
   - **Facebook**: https://developers.facebook.com/tools/debug/
   - **Twitter**: https://cards-dev.twitter.com/validator
   - **LinkedIn**: https://www.linkedin.com/post-inspector/

### Unit Tests

Comprehensive unit tests are available in `backend/internal/handlers/og_image_handler_test.go`:

```bash
./test.sh backend/internal/handlers
```

Tests cover:
- Serving cover photo when set
- Fallback to first photo
- Fallback to first public album
- Error handling for empty albums
- Error handling for missing files

## Deployment Considerations

1. **Domain Configuration**: The `og:image` URL in `index.html` is hardcoded to `https://nielsshootsfilm.com/og-image`. Update this if deploying to a different domain.

2. **Image Caching**: Social media platforms cache Open Graph images aggressively. When updating the portfolio cover image:
   - The `/og-image` endpoint will immediately serve the new image
   - But social platforms may show the old cached image for hours or days
   - Use platform-specific cache-busting tools (like Facebook's debugger) to refresh

3. **HTTPS Required**: Most social platforms require HTTPS for Open Graph images. Ensure your deployment uses HTTPS.

## Customization

To change which image is used:
1. Set a different main portfolio album in admin settings
2. Change the cover photo of the main portfolio album
3. The `/og-image` endpoint will automatically reflect these changes

## Troubleshooting

**Problem**: Social media shows old image after updating cover photo

**Solution**: Clear the cache using platform-specific tools:
- Facebook: Use the [Sharing Debugger](https://developers.facebook.com/tools/debug/)
- Twitter: Use the [Card Validator](https://cards-dev.twitter.com/validator)

**Problem**: `/og-image` returns 404

**Possible causes**:
- No portfolio album configured
- Portfolio album has no photos
- Image files are missing from disk

**Solution**: Check backend logs for specific error messages.

**Problem**: Image doesn't appear in preview on some platforms

**Possible causes**:
- Image is too large (some platforms have size limits)
- Wrong content-type header
- Image URL not accessible publicly

**Solution**: 
- Verify the display version of images are web-optimized
- Check that the backend is publicly accessible
- Verify HTTPS is working correctly
