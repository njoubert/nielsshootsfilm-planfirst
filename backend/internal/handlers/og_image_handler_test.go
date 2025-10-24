package handlers

import (
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/njoubert/nielsshootsfilm-planfirst/backend/internal/models"
	"github.com/njoubert/nielsshootsfilm-planfirst/backend/internal/services"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestOGImageHandler_ServeOGImage(t *testing.T) {
	// Create temporary directories
	tmpDataDir := t.TempDir()
	tmpUploadDir := t.TempDir()

	// Create upload subdirectories
	displayDir := filepath.Join(tmpUploadDir, "display")
	require.NoError(t, os.MkdirAll(displayDir, 0750))

	// Create a test image file
	testImagePath := filepath.Join(displayDir, "test-cover.webp")
	testImageData := []byte("fake image content")
	require.NoError(t, os.WriteFile(testImagePath, testImageData, 0600))

	// Create services
	fileService, err := services.NewFileService(tmpDataDir)
	require.NoError(t, err, "NewFileService should succeed")

	albumService := services.NewAlbumService(fileService)
	configService := services.NewSiteConfigService(fileService)

	// Create a test album with a cover photo
	album := &models.Album{
		Title:        "Test Portfolio",
		Slug:         "test-portfolio",
		Visibility:   "public",
		CoverPhotoID: "photo-1",
		Photos: []models.Photo{
			{
				ID:         "photo-1",
				URLDisplay: "/uploads/display/test-cover.webp",
			},
		},
	}
	require.NoError(t, albumService.Create(album))

	// Set this album as the main portfolio album
	config := &models.SiteConfig{
		Portfolio: models.PortfolioConfig{
			MainAlbumID: album.ID,
		},
	}
	require.NoError(t, configService.Update(config))

	// Create handler
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	handler := NewOGImageHandler(albumService, configService, tmpUploadDir, logger)

	// Create test request
	req := httptest.NewRequest("GET", "/og-image", nil)
	w := httptest.NewRecorder()

	// Call handler
	handler.ServeOGImage(w, req)

	// Check response
	assert.Equal(t, http.StatusOK, w.Code, "should return 200 OK")
	assert.Equal(t, testImageData, w.Body.Bytes(), "should return the image file content")
}

func TestOGImageHandler_ServeOGImage_FallbackToFirstPhoto(t *testing.T) {
	// Create temporary directories
	tmpDataDir := t.TempDir()
	tmpUploadDir := t.TempDir()

	// Create upload subdirectories
	displayDir := filepath.Join(tmpUploadDir, "display")
	require.NoError(t, os.MkdirAll(displayDir, 0750))

	// Create a test image file
	testImagePath := filepath.Join(displayDir, "first-photo.webp")
	testImageData := []byte("fake image content")
	require.NoError(t, os.WriteFile(testImagePath, testImageData, 0600))

	// Create services
	fileService, err := services.NewFileService(tmpDataDir)
	require.NoError(t, err, "NewFileService should succeed")

	albumService := services.NewAlbumService(fileService)
	configService := services.NewSiteConfigService(fileService)

	// Create a test album without a cover photo ID
	album := &models.Album{
		Title:      "Test Portfolio",
		Slug:       "test-portfolio",
		Visibility: "public",
		Photos: []models.Photo{
			{
				ID:         "photo-1",
				URLDisplay: "/uploads/display/first-photo.webp",
			},
		},
	}
	require.NoError(t, albumService.Create(album))

	// Set this album as the main portfolio album
	config := &models.SiteConfig{
		Portfolio: models.PortfolioConfig{
			MainAlbumID: album.ID,
		},
	}
	require.NoError(t, configService.Update(config))

	// Create handler
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	handler := NewOGImageHandler(albumService, configService, tmpUploadDir, logger)

	// Create test request
	req := httptest.NewRequest("GET", "/og-image", nil)
	w := httptest.NewRecorder()

	// Call handler
	handler.ServeOGImage(w, req)

	// Check response
	assert.Equal(t, http.StatusOK, w.Code, "should return 200 OK")
	assert.Equal(t, testImageData, w.Body.Bytes(), "should return the first photo")
}

func TestOGImageHandler_ServeOGImage_NoMainAlbum(t *testing.T) {
	// Create temporary directories
	tmpDataDir := t.TempDir()
	tmpUploadDir := t.TempDir()

	// Create upload subdirectories
	displayDir := filepath.Join(tmpUploadDir, "display")
	require.NoError(t, os.MkdirAll(displayDir, 0750))

	// Create a test image file
	testImagePath := filepath.Join(displayDir, "fallback.webp")
	testImageData := []byte("fake image content")
	require.NoError(t, os.WriteFile(testImagePath, testImageData, 0600))

	// Create services
	fileService, err := services.NewFileService(tmpDataDir)
	require.NoError(t, err, "NewFileService should succeed")

	albumService := services.NewAlbumService(fileService)
	configService := services.NewSiteConfigService(fileService)

	// Create a public album without setting it as main
	album := &models.Album{
		Title:      "Public Album",
		Slug:       "public-album",
		Visibility: "public",
		Photos: []models.Photo{
			{
				ID:         "photo-1",
				URLDisplay: "/uploads/display/fallback.webp",
			},
		},
	}
	require.NoError(t, albumService.Create(album))

	// Don't set main album ID in config - should fall back to first public album
	config := &models.SiteConfig{
		Portfolio: models.PortfolioConfig{},
	}
	require.NoError(t, configService.Update(config))

	// Create handler
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	handler := NewOGImageHandler(albumService, configService, tmpUploadDir, logger)

	// Create test request
	req := httptest.NewRequest("GET", "/og-image", nil)
	w := httptest.NewRecorder()

	// Call handler
	handler.ServeOGImage(w, req)

	// Check response
	assert.Equal(t, http.StatusOK, w.Code, "should return 200 OK")
	assert.Equal(t, testImageData, w.Body.Bytes(), "should return the first public album's photo")
}

func TestOGImageHandler_ServeOGImage_NoPhotos(t *testing.T) {
	// Create temporary directories
	tmpDataDir := t.TempDir()
	tmpUploadDir := t.TempDir()

	// Create services
	fileService, err := services.NewFileService(tmpDataDir)
	require.NoError(t, err, "NewFileService should succeed")

	albumService := services.NewAlbumService(fileService)
	configService := services.NewSiteConfigService(fileService)

	// Create an album with no photos
	album := &models.Album{
		Title:      "Empty Album",
		Slug:       "empty-album",
		Visibility: "public",
		Photos:     []models.Photo{},
	}
	require.NoError(t, albumService.Create(album))

	// Set this album as the main portfolio album
	config := &models.SiteConfig{
		Portfolio: models.PortfolioConfig{
			MainAlbumID: album.ID,
		},
	}
	require.NoError(t, configService.Update(config))

	// Create handler
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	handler := NewOGImageHandler(albumService, configService, tmpUploadDir, logger)

	// Create test request
	req := httptest.NewRequest("GET", "/og-image", nil)
	w := httptest.NewRecorder()

	// Call handler
	handler.ServeOGImage(w, req)

	// Check response
	assert.Equal(t, http.StatusNotFound, w.Code, "should return 404 when album has no photos")
}

func TestOGImageHandler_ServeOGImage_ImageNotFound(t *testing.T) {
	// Create temporary directories
	tmpDataDir := t.TempDir()
	tmpUploadDir := t.TempDir()

	// Create upload subdirectories (but don't create the image file)
	displayDir := filepath.Join(tmpUploadDir, "display")
	require.NoError(t, os.MkdirAll(displayDir, 0750))

	// Create services
	fileService, err := services.NewFileService(tmpDataDir)
	require.NoError(t, err, "NewFileService should succeed")

	albumService := services.NewAlbumService(fileService)
	configService := services.NewSiteConfigService(fileService)

	// Create an album with a photo that doesn't exist on disk
	album := &models.Album{
		Title:      "Album with Missing Image",
		Slug:       "missing-image",
		Visibility: "public",
		Photos: []models.Photo{
			{
				ID:         "photo-1",
				URLDisplay: "/uploads/display/nonexistent.webp",
			},
		},
	}
	require.NoError(t, albumService.Create(album))

	// Set this album as the main portfolio album
	config := &models.SiteConfig{
		Portfolio: models.PortfolioConfig{
			MainAlbumID: album.ID,
		},
	}
	require.NoError(t, configService.Update(config))

	// Create handler
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	handler := NewOGImageHandler(albumService, configService, tmpUploadDir, logger)

	// Create test request
	req := httptest.NewRequest("GET", "/og-image", nil)
	w := httptest.NewRecorder()

	// Call handler
	handler.ServeOGImage(w, req)

	// Check response
	assert.Equal(t, http.StatusNotFound, w.Code, "should return 404 when image file doesn't exist")
}
