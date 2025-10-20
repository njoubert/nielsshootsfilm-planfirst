package services

import (
	"errors"
	"fmt"
	"image"
	_ "image/jpeg" // Register JPEG decoder
	_ "image/png"  // Register PNG decoder
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/disintegration/imaging"
	"github.com/google/uuid"
	"github.com/njoubert/nielsshootsfilm-planfirst/backend/internal/models"
	"github.com/rwcarlsen/goexif/exif"
)

const (
	maxFileSize      = 100 * 1024 * 1024 // 100 MB
	displayMaxSize   = 3840              // 4K display version
	thumbnailMaxSize = 800               // Thumbnail size
	displayQuality   = 85                // WebP quality for display
	thumbnailQuality = 80                // WebP quality for thumbnail
)

var allowedMimeTypes = map[string]bool{
	"image/jpeg": true,
	"image/png":  true,
	"image/webp": true,
}

// ImageService handles image upload and processing.
type ImageService struct {
	uploadDir string
}

// NewImageService creates a new image service.
func NewImageService(uploadDir string) (*ImageService, error) {
	// Create upload directories
	dirs := []string{
		filepath.Join(uploadDir, "originals"),
		filepath.Join(uploadDir, "display"),
		filepath.Join(uploadDir, "thumbnails"),
	}

	for _, dir := range dirs {
		// #nosec G301 - 0755 is appropriate for upload directories
		if err := os.MkdirAll(dir, 0755); err != nil {
			return nil, fmt.Errorf("failed to create upload directory %s: %w", dir, err)
		}
	}

	return &ImageService{
		uploadDir: uploadDir,
	}, nil
}

// ProcessUpload processes an uploaded image file.
func (s *ImageService) ProcessUpload(fileHeader *multipart.FileHeader) (*models.Photo, error) {
	// Validate file size
	if fileHeader.Size > maxFileSize {
		return nil, fmt.Errorf("file size %d exceeds maximum %d", fileHeader.Size, maxFileSize)
	}

	// Open uploaded file
	file, err := fileHeader.Open()
	if err != nil {
		return nil, fmt.Errorf("failed to open uploaded file: %w", err)
	}
	defer func() { _ = file.Close() }()

	// Detect content type
	buffer := make([]byte, 512)
	if _, err := file.Read(buffer); err != nil {
		return nil, fmt.Errorf("failed to read file header: %w", err)
	}

	contentType := http.DetectContentType(buffer)
	if !allowedMimeTypes[contentType] {
		return nil, fmt.Errorf("unsupported file type: %s", contentType)
	}

	// Reset file pointer
	if _, err := file.Seek(0, 0); err != nil {
		return nil, fmt.Errorf("failed to reset file pointer: %w", err)
	}

	// Generate UUID for this photo
	photoID := uuid.New().String()

	// Decode image
	img, format, err := image.Decode(file)
	if err != nil {
		return nil, fmt.Errorf("failed to decode image: %w", err)
	}

	// Get image dimensions
	bounds := img.Bounds()
	width := bounds.Dx()
	height := bounds.Dy()

	// Reset file pointer for EXIF extraction
	if _, err := file.Seek(0, 0); err != nil {
		return nil, fmt.Errorf("failed to reset file pointer: %w", err)
	}

	// Extract EXIF data
	exifData, err := s.extractEXIF(file)
	if err != nil {
		// EXIF extraction is not critical, just log and continue
		exifData = nil
	}

	// Reset file pointer for saving original
	if _, err := file.Seek(0, 0); err != nil {
		return nil, fmt.Errorf("failed to reset file pointer: %w", err)
	}

	// Save original
	originalExt := "." + strings.ToLower(format)
	originalFilename := photoID + originalExt
	originalPath := filepath.Join(s.uploadDir, "originals", originalFilename)

	originalSize, err := s.saveFile(file, originalPath)
	if err != nil {
		return nil, fmt.Errorf("failed to save original: %w", err)
	}

	// Generate display version (WebP)
	displayFilename := photoID + ".webp"
	displayPath := filepath.Join(s.uploadDir, "display", displayFilename)

	displaySize, err := s.generateResizedVersion(img, displayPath, displayMaxSize, displayQuality)
	if err != nil {
		// Clean up original
		_ = os.Remove(originalPath)
		return nil, fmt.Errorf("failed to generate display version: %w", err)
	}

	// Generate thumbnail (WebP)
	thumbnailFilename := photoID + ".webp"
	thumbnailPath := filepath.Join(s.uploadDir, "thumbnails", thumbnailFilename)

	thumbnailSize, err := s.generateResizedVersion(img, thumbnailPath, thumbnailMaxSize, thumbnailQuality)
	if err != nil {
		// Clean up original and display
		_ = os.Remove(originalPath)
		_ = os.Remove(displayPath)
		return nil, fmt.Errorf("failed to generate thumbnail: %w", err)
	}

	// Create photo object
	photo := &models.Photo{
		FilenameOriginal:  fileHeader.Filename,
		URLOriginal:       "/uploads/originals/" + originalFilename,
		URLDisplay:        "/uploads/display/" + displayFilename,
		URLThumbnail:      "/uploads/thumbnails/" + thumbnailFilename,
		Width:             width,
		Height:            height,
		FileSizeOriginal:  originalSize,
		FileSizeDisplay:   displaySize,
		FileSizeThumbnail: thumbnailSize,
		EXIF:              exifData,
	}

	return photo, nil
}

// saveFile saves an uploaded file to disk.
func (s *ImageService) saveFile(src io.Reader, dstPath string) (int64, error) {
	// #nosec G304 - Destination path is controlled by the service
	dst, err := os.Create(dstPath)
	if err != nil {
		return 0, err
	}
	defer func() { _ = dst.Close() }()

	size, err := io.Copy(dst, src)
	if err != nil {
		return 0, err
	}

	return size, nil
}

// generateResizedVersion generates a resized WebP version of an image.
func (s *ImageService) generateResizedVersion(img image.Image, dstPath string, maxSize int, quality int) (int64, error) {
	// Resize image to fit within maxSize (maintaining aspect ratio)
	resized := imaging.Fit(img, maxSize, maxSize, imaging.Lanczos)

	// Save as WebP
	if err := imaging.Save(resized, dstPath); err != nil {
		return 0, err
	}

	// Get file size
	info, err := os.Stat(dstPath)
	if err != nil {
		return 0, err
	}

	return info.Size(), nil
}

// extractEXIF extracts EXIF data from an image file.
func (s *ImageService) extractEXIF(r io.Reader) (*models.EXIF, error) {
	x, err := exif.Decode(r)
	if err != nil {
		return nil, err
	}

	exifData := &models.EXIF{}

	// Camera make and model
	if make, err := x.Get(exif.Make); err == nil {
		if makeStr, err := make.StringVal(); err == nil {
			model := ""
			if modelTag, err := x.Get(exif.Model); err == nil {
				if modelStr, err := modelTag.StringVal(); err == nil {
					model = modelStr
				}
			}
			exifData.Camera = strings.TrimSpace(makeStr + " " + model)
		}
	}

	// Lens model
	if lens, err := x.Get(exif.LensModel); err == nil {
		if lensStr, err := lens.StringVal(); err == nil {
			exifData.Lens = lensStr
		}
	}

	// ISO
	if iso, err := x.Get(exif.ISOSpeedRatings); err == nil {
		if isoInt, err := iso.Int(0); err == nil {
			exifData.ISO = isoInt
		}
	}

	// Aperture
	if aperture, err := x.Get(exif.FNumber); err == nil {
		if apertureRat, err := aperture.Rat(0); err == nil {
			num, _ := apertureRat.Num().Float64()
			denom, _ := apertureRat.Denom().Float64()
			exifData.Aperture = fmt.Sprintf("f/%.1f", num/denom)
		}
	}

	// Shutter speed
	if shutter, err := x.Get(exif.ExposureTime); err == nil {
		if shutterRat, err := shutter.Rat(0); err == nil {
			num, _ := shutterRat.Num().Float64()
			denom, _ := shutterRat.Denom().Float64()
			if denom > num {
				exifData.ShutterSpeed = fmt.Sprintf("1/%d", int(denom/num))
			} else {
				exifData.ShutterSpeed = fmt.Sprintf("%.1fs", num/denom)
			}
		}
	}

	// Focal length
	if focal, err := x.Get(exif.FocalLength); err == nil {
		if focalRat, err := focal.Rat(0); err == nil {
			num, _ := focalRat.Num().Float64()
			denom, _ := focalRat.Denom().Float64()
			exifData.FocalLength = fmt.Sprintf("%.0fmm", num/denom)
		}
	}

	// Date taken
	if dateTime, err := x.DateTime(); err == nil {
		exifData.DateTaken = &dateTime
	}

	return exifData, nil
}

// DeletePhoto deletes all versions of a photo.
func (s *ImageService) DeletePhoto(photo *models.Photo) error {
	errors := []error{}

	// Extract filename from URL
	originalFilename := filepath.Base(photo.URLOriginal)
	displayFilename := filepath.Base(photo.URLDisplay)
	thumbnailFilename := filepath.Base(photo.URLThumbnail)

	// Delete original
	originalPath := filepath.Join(s.uploadDir, "originals", originalFilename)
	if err := os.Remove(originalPath); err != nil && !os.IsNotExist(err) {
		errors = append(errors, fmt.Errorf("failed to delete original: %w", err))
	}

	// Delete display version
	displayPath := filepath.Join(s.uploadDir, "display", displayFilename)
	if err := os.Remove(displayPath); err != nil && !os.IsNotExist(err) {
		errors = append(errors, fmt.Errorf("failed to delete display version: %w", err))
	}

	// Delete thumbnail
	thumbnailPath := filepath.Join(s.uploadDir, "thumbnails", thumbnailFilename)
	if err := os.Remove(thumbnailPath); err != nil && !os.IsNotExist(err) {
		errors = append(errors, fmt.Errorf("failed to delete thumbnail: %w", err))
	}

	if len(errors) > 0 {
		return fmt.Errorf("errors deleting photo: %v", errors)
	}

	return nil
}

// ValidateFilename checks for path traversal attacks.
func ValidateFilename(filename string) error {
	if strings.Contains(filename, "..") || strings.Contains(filename, "/") || strings.Contains(filename, "\\") {
		return errors.New("invalid filename: path traversal attempt detected")
	}
	return nil
}
