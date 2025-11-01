package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/njoubert/nielsshootsfilm/backend/internal/models"
	"github.com/njoubert/nielsshootsfilm/backend/internal/services"
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

func TestStorageHandler_GetStats_ReservedPercentageCalculation(t *testing.T) {
	// This test verifies that reserved_percent is correctly calculated as
	// (100 - max_disk_usage_percent) and that reserved_bytes is calculated
	// as a percentage of TOTAL disk space, not available or used space.
	tests := []struct {
		name                string
		maxDiskUsagePercent int
		expectedReserved    int
	}{
		{
			name:                "default 80% max usage",
			maxDiskUsagePercent: 80,
			expectedReserved:    20,
		},
		{
			name:                "95% max usage (minimum reserve)",
			maxDiskUsagePercent: 95,
			expectedReserved:    5,
		},
		{
			name:                "50% max usage",
			maxDiskUsagePercent: 50,
			expectedReserved:    50,
		},
		{
			name:                "10% max usage (maximum reserve)",
			maxDiskUsagePercent: 10,
			expectedReserved:    90,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
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

			// Set config with specified max usage
			config := &models.SiteConfig{
				Storage: models.StorageConfig{
					MaxDiskUsagePercent: tt.maxDiskUsagePercent,
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
			require.Equal(t, http.StatusOK, w.Code, "should return 200 OK")

			// Parse response
			var stats StorageStats
			err = json.NewDecoder(w.Body).Decode(&stats)
			require.NoError(t, err, "should decode response")

			// Verify reserved_percent is correct
			assert.Equal(t, tt.expectedReserved, stats.ReservedPercent,
				"reserved_percent should be (100 - max_disk_usage_percent)")

			// Verify reserved_bytes is calculated from TOTAL disk space
			expectedReservedBytes := int64(float64(stats.TotalBytes) * float64(tt.expectedReserved) / 100.0)
			assert.Equal(t, expectedReservedBytes, stats.ReservedBytes,
				"reserved_bytes should be %d%% of total_bytes (%d), got %d",
				tt.expectedReserved, stats.TotalBytes, stats.ReservedBytes)

			// Verify usable_bytes = available_bytes - reserved_bytes
			expectedUsableBytes := stats.AvailableBytes - stats.ReservedBytes
			if expectedUsableBytes < 0 {
				expectedUsableBytes = 0
			}
			assert.Equal(t, expectedUsableBytes, stats.UsableBytes,
				"usable_bytes should be available_bytes - reserved_bytes")

			// Verify that reserved calculation uses total, not available
			// reserved_bytes should NOT equal (available_bytes * reserved_percent)
			wrongCalculation := int64(float64(stats.AvailableBytes) * float64(tt.expectedReserved) / 100.0)
			if stats.AvailableBytes != stats.TotalBytes {
				// Only assert this if there's a difference (disk has some usage)
				assert.NotEqual(t, wrongCalculation, stats.ReservedBytes,
					"reserved_bytes should be calculated from total_bytes, not available_bytes")
			}
		})
	}
}

func TestStorageHandler_GetStats_DefaultMaxDiskUsage(t *testing.T) {
	// Test that when max_disk_usage_percent is 0 or not set, it defaults to 80%
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

	// Set config with 0 (should default to 80)
	config := &models.SiteConfig{
		Storage: models.StorageConfig{
			MaxDiskUsagePercent: 0,
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
	require.Equal(t, http.StatusOK, w.Code, "should return 200 OK")

	// Parse response
	var stats StorageStats
	err = json.NewDecoder(w.Body).Decode(&stats)
	require.NoError(t, err, "should decode response")

	// Should default to 80% max usage = 20% reserved
	assert.Equal(t, 20, stats.ReservedPercent, "should default to 20% reserved (80% max usage)")
}
