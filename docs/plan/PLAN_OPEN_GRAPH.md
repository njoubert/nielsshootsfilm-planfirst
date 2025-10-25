# Open Graph and Social Media Sharing Plan

## Overview

Implement Open Graph (OG) meta tags to enable rich social media previews when sharing links on platforms like iMessage, Facebook, Twitter, LinkedIn, and others. This will display a preview card with an image, title, and description instead of just a plain link.

## Open Graph Standard

Open Graph is a protocol that enables any web page to become a rich object in a social graph. Key meta tags include:

- `og:title` - The title of the page
- `og:description` - A brief description
- `og:image` - URL to an image representing the content
- `og:url` - The canonical URL
- `og:type` - Type of content (website, article, etc.)
- `og:site_name` - The name of the overall site

Additional Twitter Card tags for better Twitter integration:

- `twitter:card` - Summary card type (summary_large_image)
- `twitter:title` - Title for Twitter
- `twitter:description` - Description for Twitter
- `twitter:image` - Image URL for Twitter

## Design Approach

### Constraints

1. **Static Frontend Requirement**: The website must remain static for visitors with no dynamic server-side rendering
2. **Single Image Strategy**: Use the portfolio album's cover photo as the OG image across all pages
3. **SEO-Friendly**: Image must be publicly accessible and properly sized for social platforms

### Solution Architecture

#### Phase 1: Static OG Image Generation

When the user sets a cover photo for the main portfolio album, the admin backend will automatically generate and save a dedicated OG image:

**Image Specifications:**

- **Dimensions**: 1200x630px (standard OG image size)
- **Format**: JPEG (best compatibility)
- **Quality**: 85% (balance between quality and file size)
- **Location**: `/data/og-image.jpg` (fixed, well-known path)
- **Fallback**: If no portfolio album exists, use a placeholder or site logo

**Backend Implementation:**

1. When setting a portfolio album cover photo, trigger OG image generation
2. Load the cover photo's original image
3. Resize/crop to 1200x630px using libvips (maintaining aspect ratio, center crop)
4. Save as `/data/og-image.jpg`
5. Overwrite any existing OG image (only one active at a time)

#### Phase 2: Dynamic Meta Tags in Frontend

Update `index.html` to include OG meta tags that reference the static image and dynamically loaded site config data.

**Initial Load (Static HTML):**

```html
<meta property="og:type" content="website" />
<meta property="og:image" content="/data/og-image.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:type" content="image/jpeg" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="/data/og-image.jpg" />

<!-- These will be updated by app-shell when config loads -->
<meta property="og:title" content="Photography Portfolio" />
<meta property="og:description" content="Photography portfolio and gallery" />
<meta property="og:url" content="/" />
<meta property="og:site_name" content="Photography Portfolio" />
<meta name="twitter:title" content="Photography Portfolio" />
<meta name="twitter:description" content="Photography portfolio and gallery" />
```

**Dynamic Update (app-shell.ts):**

When site config loads, update the meta tags with the actual site title and description:

```typescript
private async initialize() {
  try {
    this.config = await fetchSiteConfig();

    // Update document title
    if (this.config?.site?.title) {
      document.title = this.config.site.title;
    }

    // Update Open Graph meta tags
    this.updateOpenGraphTags();
  } catch (error) {
    console.error('Failed to load site config:', error);
  }
}

private updateOpenGraphTags() {
  if (!this.config?.site) return;

  const title = this.config.site.title || 'Photography Portfolio';
  const description = this.config.site.description || 'Photography portfolio and gallery';
  const url = window.location.origin + window.location.pathname;

  // Update OG tags
  this.updateMetaTag('og:title', title);
  this.updateMetaTag('og:description', description);
  this.updateMetaTag('og:url', url);
  this.updateMetaTag('og:site_name', title);

  // Update Twitter tags
  this.updateMetaTag('twitter:title', title, 'name');
  this.updateMetaTag('twitter:description', description, 'name');
}

private updateMetaTag(property: string, content: string, attr: 'property' | 'name' = 'property') {
  let meta = document.querySelector(`meta[${attr}="${property}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attr, property);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}
```

## Implementation Steps

### Backend Changes

#### 1. Add OG Image Generation to Album Service

**File**: `backend/internal/services/album_service.go`

Add method to generate OG image from cover photo:

```go
func (s *AlbumService) GenerateOGImage(coverPhotoPath string) error {
    // Load original image
    img, err := vips.NewImageFromFile(coverPhotoPath)
    if err != nil {
        return fmt.Errorf("failed to load cover photo: %w", err)
    }
    defer img.Close()

    // Target dimensions for OG image
    targetWidth := 1200
    targetHeight := 630

    // Calculate crop dimensions (center crop)
    srcWidth := img.Width()
    srcHeight := img.Height()

    // Determine scale factor to cover target dimensions
    scaleWidth := float64(targetWidth) / float64(srcWidth)
    scaleHeight := float64(targetHeight) / float64(srcHeight)
    scale := math.Max(scaleWidth, scaleHeight)

    // Resize
    if err := img.Resize(scale, vips.KernelLanczos3); err != nil {
        return fmt.Errorf("failed to resize: %w", err)
    }

    // Center crop
    left := (img.Width() - targetWidth) / 2
    top := (img.Height() - targetHeight) / 2
    if err := img.ExtractArea(left, top, targetWidth, targetHeight); err != nil {
        return fmt.Errorf("failed to crop: %w", err)
    }

    // Save as JPEG
    ogPath := filepath.Join("data", "og-image.jpg")
    jpegParams := vips.NewJpegExportParams()
    jpegParams.Quality = 85

    buf, _, err := img.ExportJpeg(jpegParams)
    if err != nil {
        return fmt.Errorf("failed to export jpeg: %w", err)
    }

    if err := os.WriteFile(ogPath, buf, 0644); err != nil {
        return fmt.Errorf("failed to write og image: %w", err)
    }

    return nil
}
```

#### 2. Trigger OG Generation on Portfolio Album Update

**File**: `backend/internal/handlers/album_handler.go`

Update the `SetCoverPhoto` and `SetMainPortfolioAlbum` handlers:

```go
func (h *AlbumHandler) SetCoverPhoto(c *gin.Context) {
    // ...existing code...

    // After successfully setting cover photo
    if err := h.albumService.UpdateAlbum(albumID, updatedAlbum); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    // Check if this is the main portfolio album
    config, _ := h.configService.GetSiteConfig()
    if config != nil && config.Portfolio.MainAlbumID == albumID {
        // Generate OG image from the new cover photo
        coverPhoto := updatedAlbum.GetCoverPhoto()
        if coverPhoto != nil {
            coverPhotoPath := filepath.Join("static", coverPhoto.URLOriginal)
            if err := h.albumService.GenerateOGImage(coverPhotoPath); err != nil {
                log.Printf("Failed to generate OG image: %v", err)
                // Don't fail the request, just log the error
            }
        }
    }

    c.JSON(http.StatusOK, updatedAlbum)
}

func (h *AlbumHandler) SetMainPortfolioAlbum(c *gin.Context) {
    // ...existing code...

    // After successfully setting main portfolio album
    album, err := h.albumService.GetAlbumByID(albumID)
    if err == nil {
        coverPhoto := album.GetCoverPhoto()
        if coverPhoto != nil {
            coverPhotoPath := filepath.Join("static", coverPhoto.URLOriginal)
            if err := h.albumService.GenerateOGImage(coverPhotoPath); err != nil {
                log.Printf("Failed to generate OG image: %v", err)
            }
        }
    }

    c.JSON(http.StatusOK, gin.H{"message": "Main portfolio album updated"})
}
```

### Frontend Changes

#### 1. Update index.html with OG Tags

**File**: `frontend/src/index.html`

Add OG meta tags in the `<head>` section:

```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Photography Portfolio</title>
  <meta name="description" content="Photography portfolio and gallery" />

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="/" />
  <meta property="og:title" content="Photography Portfolio" />
  <meta property="og:description" content="Photography portfolio and gallery" />
  <meta property="og:image" content="/data/og-image.jpg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:site_name" content="Photography Portfolio" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="/" />
  <meta name="twitter:title" content="Photography Portfolio" />
  <meta name="twitter:description" content="Photography portfolio and gallery" />
  <meta name="twitter:image" content="/data/og-image.jpg" />

  <!-- Rest of head content... -->
</head>
```

#### 2. Update app-shell.ts to Dynamically Update Tags

**File**: `frontend/src/components/app-shell.ts`

Add methods to update OG tags when config loads:

```typescript
private async initialize() {
  try {
    this.config = await fetchSiteConfig();

    // Update document title
    if (this.config?.site?.title) {
      document.title = this.config.site.title;
    }

    // Update Open Graph tags
    this.updateOpenGraphTags();
  } catch (error) {
    console.error('Failed to load site config:', error);
  }

  // ...rest of initialization...
}

private updateOpenGraphTags() {
  if (!this.config?.site) return;

  const title = this.config.site.title || 'Photography Portfolio';
  const description = this.config.site.description || 'Photography portfolio and gallery';
  const url = window.location.origin + window.location.pathname;

  // Update OG tags
  this.updateMetaTag('og:title', title);
  this.updateMetaTag('og:description', description);
  this.updateMetaTag('og:url', url);
  this.updateMetaTag('og:site_name', title);

  // Update Twitter tags
  this.updateMetaTag('twitter:title', title, 'name');
  this.updateMetaTag('twitter:description', description, 'name');
  this.updateMetaTag('twitter:url', url, 'name');
}

private updateMetaTag(property: string, content: string, attr: 'property' | 'name' = 'property') {
  let meta = document.querySelector(`meta[${attr}="${property}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attr, property);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}
```

## Testing

### Manual Testing Checklist

1. **OG Image Generation**

   - [ ] Create a new album and set it as the main portfolio album
   - [ ] Upload a photo and set it as cover
   - [ ] Verify `/data/og-image.jpg` is created with correct dimensions (1200x630)
   - [ ] Change cover photo and verify OG image updates

2. **Meta Tag Validation**

   - [ ] View page source and verify all OG tags are present
   - [ ] Use [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
   - [ ] Use [Twitter Card Validator](https://cards-dev.twitter.com/validator)
   - [ ] Use [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)

3. **Social Media Preview Testing**
   - [ ] Share link in iMessage and verify preview card appears
   - [ ] Share link on Facebook and verify preview
   - [ ] Share link on Twitter and verify card
   - [ ] Share link on LinkedIn and verify preview

### Browser Testing

Test OG tag updates work correctly:

```typescript
// Test in browser console
test('OG tags update with site config', async () => {
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const twitterTitle = document.querySelector('meta[name="twitter:title"]');

  expect(ogTitle?.getAttribute('content')).toBe('Niels Shoots Film');
  expect(twitterTitle?.getAttribute('content')).toBe('Niels Shoots Film');
});
```

## Fallback Strategy

If no portfolio album or cover photo exists:

1. Backend should check for existence of OG image before attempting to use cover photo
2. Create a default branded OG image with site title and logo
3. Store as `/data/og-image-default.jpg`
4. Use this as fallback in `index.html` if `/data/og-image.jpg` doesn't exist

## Cache Considerations

Social media platforms cache OG images aggressively. After updating:

1. **Force Refresh**: Use Facebook Sharing Debugger "Scrape Again" button
2. **URL Parameters**: Can append `?v=timestamp` to force new cache (not recommended for production)
3. **Wait Time**: Changes may take 24-48 hours to propagate naturally

## Future Enhancements

1. **Album-Specific OG Images**: Generate unique OG images for each album detail page
2. **Dynamic Text Overlay**: Add album title as text overlay on OG image
3. **Multiple Image Sizes**: Generate different sizes for different platforms
4. **OG Image Preview**: Show OG image preview in admin dashboard

## Success Metrics

- Links shared on social media display rich preview cards
- OG image loads successfully in Facebook/Twitter validators
- User feedback confirms improved sharing experience
- Analytics show increased click-through from shared links
