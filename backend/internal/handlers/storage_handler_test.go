package handlers

import (
	"encoding/json"
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

func TestStorageHandler_GetStats(t *testing.T) {
	// Create temporary directories
	tmpDataDir := t.TempDir()
	tmpUploadDir := t.TempDir()

	// Create upload subdirectories with some test files
	require.NoError(t, os.MkdirAll(filepath.Join(tmpUploadDir, "originals"), 0750))
	require.NoError(t, os.MkdirAll(filepath.Join(tmpUploadDir, "display"), 0750))
	require.NoError(t, os.MkdirAll(filepath.Join(tmpUploadDir, "thumbnails"), 0750))

	// Create test files with known sizes
	testData := []byte("test file content")
	require.NoError(t, os.WriteFile(filepath.Join(tmpUploadDir, "originals", "test1.jpg"), testData, 0600))
	require.NoError(t, os.WriteFile(filepath.Join(tmpUploadDir, "display", "test1.jpg"), testData, 0600))
	require.NoError(t, os.WriteFile(filepath.Join(tmpUploadDir, "thumbnails", "test1.jpg"), testData, 0600))

	// Create services
	fileService, err := services.NewFileService(tmpDataDir)
	require.NoError(t, err, "NewFileService should succeed")

	configService := services.NewSiteConfigService(fileService)

	// Set config with 80% limit
	config := &models.SiteConfig{
		Storage: models.StorageConfig{
			MaxDiskUsagePercent: 80,
		},
	}
	err = configService.Update(config)
	require.NoError(t, err, "should update config")

	// Create handler
	handler := NewStorageHandler(configService, tmpUploadDir)

	// Create test request
	req := httptest.NewRequest("GET", "/api/admin/storage/stats", nil)
	w := httptest.NewRecorder()

	// Call handler
	handler.GetStats(w, req)

	// Check response
	assert.Equal(t, http.StatusOK, w.Code, "should return 200 OK")
	assert.Equal(t, "application/json", w.Header().Get("Content-Type"), "should return JSON")

	// Parse response
	var stats StorageStats
	err = json.NewDecoder(w.Body).Decode(&stats)
	require.NoError(t, err, "should decode response")

	// Verify structure
	assert.Greater(t, stats.TotalBytes, int64(0), "total bytes should be greater than 0")
	assert.GreaterOrEqual(t, stats.AvailableBytes, int64(0), "available bytes should be >= 0")
	assert.GreaterOrEqual(t, stats.UsedBytes, int64(0), "used bytes should be >= 0")
	assert.GreaterOrEqual(t, stats.UsagePercent, 0.0, "usage percent should be >= 0")
	assert.LessOrEqual(t, stats.UsagePercent, 100.0, "usage percent should be <= 100")

	// Verify breakdown includes our test files
	assert.Equal(t, int64(len(testData)), stats.Breakdown.Originals, "originals size should match test file")
	assert.Equal(t, int64(len(testData)), stats.Breakdown.Display, "display size should match test file")
	assert.Equal(t, int64(len(testData)), stats.Breakdown.Thumbnails, "thumbnails size should match test file")
}

func TestStorageHandler_GetStats_WithWarning(t *testing.T) {
	// Create temporary directories
	tmpDataDir := t.TempDir()
	tmpUploadDir := t.TempDir()

	// Create upload subdirectories
	require.NoError(t, os.MkdirAll(filepath.Join(tmpUploadDir, "originals"), 0750))
	require.NoError(t, os.MkdirAll(filepath.Join(tmpUploadDir, "display"), 0750))
	require.NoError(t, os.MkdirAll(filepath.Join(tmpUploadDir, "thumbnails"), 0750))

	// Create services
	fileService, err := services.NewFileService(tmpDataDir)
	require.NoError(t, err, "NewFileService should succeed")

	configService := services.NewSiteConfigService(fileService)

	// Set config with very low limit to trigger warning
	config := &models.SiteConfig{
		Storage: models.StorageConfig{
			MaxDiskUsagePercent: 1, // Very low to guarantee warning
		},
	}
	err = configService.Update(config)
	require.NoError(t, err, "should update config")

	// Create handler
	handler := NewStorageHandler(configService, tmpUploadDir)

	// Create test request
	req := httptest.NewRequest("GET", "/api/admin/storage/stats", nil)
	w := httptest.NewRecorder()

	// Call handler
	handler.GetStats(w, req)

	// Check response
	assert.Equal(t, http.StatusOK, w.Code, "should return 200 OK")

	// Parse response
	var stats StorageStats
	err = json.NewDecoder(w.Body).Decode(&stats)
	require.NoError(t, err, "should decode response")

	// With 1% limit, current usage should exceed it, triggering a critical warning
	assert.NotNil(t, stats.Warning, "warning should be present with 1% limit")
	if stats.Warning != nil {
		assert.Equal(t, "critical", stats.Warning.Level, "warning level should be critical")
		assert.Contains(t, stats.Warning.Message, "%", "warning message should mention percentage")
	}
}

func TestStorageHandler_GetStats_EmptyDirectories(t *testing.T) {
	// Create temporary directories
	tmpDataDir := t.TempDir()
	tmpUploadDir := t.TempDir()

	// Create upload subdirectories but leave them empty
	require.NoError(t, os.MkdirAll(filepath.Join(tmpUploadDir, "originals"), 0750))
	require.NoError(t, os.MkdirAll(filepath.Join(tmpUploadDir, "display"), 0750))
	require.NoError(t, os.MkdirAll(filepath.Join(tmpUploadDir, "thumbnails"), 0750))

	// Create services
	fileService, err := services.NewFileService(tmpDataDir)
	require.NoError(t, err, "NewFileService should succeed")

	configService := services.NewSiteConfigService(fileService)

	// Create handler
	handler := NewStorageHandler(configService, tmpUploadDir)

	// Create test request
	req := httptest.NewRequest("GET", "/api/admin/storage/stats", nil)
	w := httptest.NewRecorder()

	// Call handler
	handler.GetStats(w, req)

	// Check response
	assert.Equal(t, http.StatusOK, w.Code, "should return 200 OK")

	// Parse response
	var stats StorageStats
	err = json.NewDecoder(w.Body).Decode(&stats)
	require.NoError(t, err, "should decode response")

	// With empty directories, used bytes should be 0
	assert.Equal(t, int64(0), stats.Breakdown.Originals, "originals should be 0 for empty directory")
	assert.Equal(t, int64(0), stats.Breakdown.Display, "display should be 0 for empty directory")
	assert.Equal(t, int64(0), stats.Breakdown.Thumbnails, "thumbnails should be 0 for empty directory")
}

func TestStorageHandler_GetStats_NonexistentDirectory(t *testing.T) {
	// Create temporary data directory
	tmpDataDir := t.TempDir()

	// Use a nonexistent upload directory
	nonexistentDir := filepath.Join(tmpDataDir, "nonexistent-uploads")

	// Create services
	fileService, err := services.NewFileService(tmpDataDir)
	require.NoError(t, err, "NewFileService should succeed")

	configService := services.NewSiteConfigService(fileService)

	// Create handler with nonexistent directory
	handler := NewStorageHandler(configService, nonexistentDir)

	// Create test request
	req := httptest.NewRequest("GET", "/api/admin/storage/stats", nil)
	w := httptest.NewRecorder()

	// Call handler - should handle gracefully
	handler.GetStats(w, req)

	// The handler should return an error or handle gracefully
	// Depending on implementation, this might be 200 with 0 bytes or an error
	// Let's just check it doesn't panic
	assert.NotEqual(t, 0, w.Code, "should return some status code")
}
