package services

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/njoubert/nielsshootsfilm-planfirst/backend/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestDetectContentType(t *testing.T) {
	tests := []struct {
		name     string
		data     []byte
		filename string
		want     string
	}{
		{
			name:     "HEIC file with heic brand",
			data:     []byte{0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63},
			filename: "photo.heic",
			want:     "image/heic",
		},
		{
			name:     "HEIC file with heix brand",
			data:     []byte{0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x78},
			filename: "photo.heic",
			want:     "image/heic",
		},
		{
			name:     "HEIF file with mif1 brand and .heif extension",
			data:     []byte{0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6d, 0x69, 0x66, 0x31},
			filename: "photo.heif",
			want:     "image/heif",
		},
		{
			name:     "HEIC file with mif1 brand and .heic extension",
			data:     []byte{0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6d, 0x69, 0x66, 0x31},
			filename: "photo.heic",
			want:     "image/heic",
		},
		{
			name:     "JPEG file",
			data:     []byte{0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01},
			filename: "photo.jpg",
			want:     "image/jpeg",
		},
		{
			name:     "PNG file",
			data:     []byte{0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D},
			filename: "photo.png",
			want:     "image/png",
		},
		{
			name:     "Too short data",
			data:     []byte{0x00, 0x00, 0x00},
			filename: "photo.heic",
			want:     "application/octet-stream",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := detectContentType(tt.data, tt.filename)
			if got != tt.want {
				t.Errorf("detectContentType() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestValidateFilename(t *testing.T) {
	tests := []struct {
		name     string
		filename string
		wantErr  bool
	}{
		{
			name:     "Valid filename",
			filename: "photo.jpg",
			wantErr:  false,
		},
		{
			name:     "Valid filename with UUID",
			filename: "123e4567-e89b-12d3-a456-426614174000.heic",
			wantErr:  false,
		},
		{
			name:     "Path traversal with ..",
			filename: "../etc/passwd",
			wantErr:  true,
		},
		{
			name:     "Path traversal with /",
			filename: "path/to/file.jpg",
			wantErr:  true,
		},
		{
			name:     "Path traversal with backslash",
			filename: "path\\to\\file.jpg",
			wantErr:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateFilename(tt.filename)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateFilename() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestFormatBytes(t *testing.T) {
	tests := []struct {
		name  string
		bytes int64
		want  string
	}{
		{
			name:  "Bytes",
			bytes: 500,
			want:  "500 B",
		},
		{
			name:  "Kilobytes",
			bytes: 1024,
			want:  "1.0 KB",
		},
		{
			name:  "Kilobytes with decimal",
			bytes: 1536,
			want:  "1.5 KB",
		},
		{
			name:  "Megabytes",
			bytes: 1048576,
			want:  "1.0 MB",
		},
		{
			name:  "Megabytes with decimal",
			bytes: 305698438, // Example from user's error message
			want:  "291.5 MB",
		},
		{
			name:  "100 MB limit",
			bytes: 104857600,
			want:  "100.0 MB",
		},
		{
			name:  "Gigabytes",
			bytes: 1073741824,
			want:  "1.0 GB",
		},
		{
			name:  "Zero bytes",
			bytes: 0,
			want:  "0 B",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := formatBytes(tt.bytes)
			if got != tt.want {
				t.Errorf("formatBytes() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestImageService_DeletePhoto(t *testing.T) {
	// Create a temporary directory for uploads
	tmpDir := t.TempDir()

	// Create subdirectories
	require.NoError(t, os.MkdirAll(filepath.Join(tmpDir, "originals"), 0750))
	require.NoError(t, os.MkdirAll(filepath.Join(tmpDir, "display"), 0750))
	require.NoError(t, os.MkdirAll(filepath.Join(tmpDir, "thumbnails"), 0750))

	// Create test files
	originalFile := filepath.Join(tmpDir, "originals", "test-photo.jpg")
	displayFile := filepath.Join(tmpDir, "display", "test-photo.jpg")
	thumbnailFile := filepath.Join(tmpDir, "thumbnails", "test-photo.jpg")

	require.NoError(t, os.WriteFile(originalFile, []byte("original"), 0600))
	require.NoError(t, os.WriteFile(displayFile, []byte("display"), 0600))
	require.NoError(t, os.WriteFile(thumbnailFile, []byte("thumbnail"), 0600))

	// Verify files exist
	_, err := os.Stat(originalFile)
	require.NoError(t, err, "original file should exist")
	_, err = os.Stat(displayFile)
	require.NoError(t, err, "display file should exist")
	_, err = os.Stat(thumbnailFile)
	require.NoError(t, err, "thumbnail file should exist")

	// Create image service
	imageService, err := NewImageService(tmpDir)
	require.NoError(t, err, "NewImageService should succeed")

	// Create photo model
	photo := &models.Photo{
		ID:               "test-photo",
		FilenameOriginal: "test-photo.jpg",
		URLOriginal:      "/uploads/originals/test-photo.jpg",
		URLDisplay:       "/uploads/display/test-photo.jpg",
		URLThumbnail:     "/uploads/thumbnails/test-photo.jpg",
	}

	// Delete the photo
	err = imageService.DeletePhoto(photo)
	assert.NoError(t, err, "DeletePhoto should succeed")

	// Verify files are deleted
	_, err = os.Stat(originalFile)
	assert.True(t, os.IsNotExist(err), "original file should be deleted")
	_, err = os.Stat(displayFile)
	assert.True(t, os.IsNotExist(err), "display file should be deleted")
	_, err = os.Stat(thumbnailFile)
	assert.True(t, os.IsNotExist(err), "thumbnail file should be deleted")
}

func TestImageService_DeletePhoto_NonexistentFiles(t *testing.T) {
	// Create a temporary directory for uploads
	tmpDir := t.TempDir()

	// Create image service
	imageService, err := NewImageService(tmpDir)
	require.NoError(t, err, "NewImageService should succeed")

	// Create photo model pointing to nonexistent files
	photo := &models.Photo{
		ID:               "test-photo",
		FilenameOriginal: "nonexistent.jpg",
		URLOriginal:      "/uploads/originals/nonexistent.jpg",
		URLDisplay:       "/uploads/display/nonexistent.jpg",
		URLThumbnail:     "/uploads/thumbnails/nonexistent.jpg",
	}

	// Delete the photo (should not error on nonexistent files)
	err = imageService.DeletePhoto(photo)
	assert.NoError(t, err, "DeletePhoto should succeed even if files don't exist")
}
