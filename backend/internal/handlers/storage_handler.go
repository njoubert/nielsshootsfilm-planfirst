package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"syscall"

	"github.com/njoubert/nielsshootsfilm-planfirst/backend/internal/services"
)

// StorageHandler handles storage-related admin API endpoints.
type StorageHandler struct {
	configService *services.SiteConfigService
	uploadDir     string
}

// NewStorageHandler creates a new storage handler.
func NewStorageHandler(configService *services.SiteConfigService, uploadDir string) *StorageHandler {
	return &StorageHandler{
		configService: configService,
		uploadDir:     uploadDir,
	}
}

// StorageStats represents storage statistics.
type StorageStats struct {
	TotalBytes      int64           `json:"total_bytes"`
	UsedBytes       int64           `json:"used_bytes"`
	AvailableBytes  int64           `json:"available_bytes"`
	ReservedBytes   int64           `json:"reserved_bytes"`
	UsableBytes     int64           `json:"usable_bytes"`
	ReservedPercent int             `json:"reserved_percent"`
	UsagePercent    float64         `json:"usage_percent"`
	Breakdown       StorageByType   `json:"breakdown"`
	Warning         *StorageWarning `json:"warning,omitempty"`
}

// StorageByType breaks down storage by upload type.
type StorageByType struct {
	Originals  int64 `json:"originals_bytes"`
	Display    int64 `json:"display_bytes"`
	Thumbnails int64 `json:"thumbnails_bytes"`
}

// StorageWarning provides warning information if storage is getting full.
type StorageWarning struct {
	Level   string `json:"level"` // warning, critical
	Message string `json:"message"`
}

// GetStats handles GET /api/admin/storage/stats.
func (h *StorageHandler) GetStats(w http.ResponseWriter, r *http.Request) {
	// Get filesystem stats
	var stat syscall.Statfs_t
	if err := syscall.Statfs(h.uploadDir, &stat); err != nil {
		http.Error(w, fmt.Sprintf("Failed to get filesystem stats: %v", err), http.StatusInternalServerError)
		return
	}

	// Calculate total and available space
	// #nosec G115 - disk size conversions are safe for reasonable disk sizes
	totalBytes := int64(stat.Blocks) * int64(stat.Bsize)
	// #nosec G115 - disk size conversions are safe for reasonable disk sizes
	availableBytes := int64(stat.Bavail) * int64(stat.Bsize)

	// Calculate space used by uploads
	breakdown, err := h.calculateStorageBreakdown()
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to calculate storage breakdown: %v", err), http.StatusInternalServerError)
		return
	}

	usedBytes := breakdown.Originals + breakdown.Display + breakdown.Thumbnails
	usagePercent := (float64(totalBytes-availableBytes) / float64(totalBytes)) * 100

	// Calculate reserved space (always 5% minimum)
	reservedPercent := 5
	reservedBytes := int64(float64(totalBytes) * float64(reservedPercent) / 100.0)
	usableBytes := availableBytes - reservedBytes
	if usableBytes < 0 {
		usableBytes = 0
	}

	// Get config to check threshold
	config, err := h.configService.Get()
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to get config: %v", err), http.StatusInternalServerError)
		return
	}

	maxPercent := config.Storage.MaxDiskUsagePercent
	if maxPercent == 0 {
		maxPercent = 80 // Default
	}

	// Determine warning status
	var warning *StorageWarning
	if usagePercent >= float64(maxPercent) {
		warning = &StorageWarning{
			Level:   "critical",
			Message: fmt.Sprintf("Disk usage is at %.1f%%, exceeding the limit of %d%%", usagePercent, maxPercent),
		}
	} else if usagePercent >= float64(maxPercent-10) {
		warning = &StorageWarning{
			Level:   "warning",
			Message: fmt.Sprintf("Disk usage is at %.1f%%, approaching the limit of %d%%", usagePercent, maxPercent),
		}
	}

	stats := StorageStats{
		TotalBytes:      totalBytes,
		UsedBytes:       usedBytes,
		AvailableBytes:  availableBytes,
		ReservedBytes:   reservedBytes,
		UsableBytes:     usableBytes,
		ReservedPercent: reservedPercent,
		UsagePercent:    usagePercent,
		Breakdown:       *breakdown,
		Warning:         warning,
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(stats); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// calculateStorageBreakdown walks the upload directories and calculates total sizes.
func (h *StorageHandler) calculateStorageBreakdown() (*StorageByType, error) {
	breakdown := &StorageByType{}

	// Calculate originals
	originalsDir := filepath.Join(h.uploadDir, "originals")
	size, err := calculateDirectorySize(originalsDir)
	if err != nil {
		return nil, fmt.Errorf("failed to calculate originals size: %w", err)
	}
	breakdown.Originals = size

	// Calculate display
	displayDir := filepath.Join(h.uploadDir, "display")
	size, err = calculateDirectorySize(displayDir)
	if err != nil {
		return nil, fmt.Errorf("failed to calculate display size: %w", err)
	}
	breakdown.Display = size

	// Calculate thumbnails
	thumbnailsDir := filepath.Join(h.uploadDir, "thumbnails")
	size, err = calculateDirectorySize(thumbnailsDir)
	if err != nil {
		return nil, fmt.Errorf("failed to calculate thumbnails size: %w", err)
	}
	breakdown.Thumbnails = size

	return breakdown, nil
}

// calculateDirectorySize recursively calculates the total size of a directory.
func calculateDirectorySize(dirPath string) (int64, error) {
	var totalSize int64

	err := filepath.Walk(dirPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			// Skip directories that don't exist yet
			if os.IsNotExist(err) {
				return nil
			}
			return err
		}
		if !info.IsDir() {
			totalSize += info.Size()
		}
		return nil
	})

	return totalSize, err
}
