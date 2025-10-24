package handlers

import (
	"log/slog"
	"net/http"
	"os"
	"path/filepath"

	"github.com/njoubert/nielsshootsfilm-planfirst/backend/internal/services"
)

// OGImageHandler handles Open Graph image requests.
type OGImageHandler struct {
	albumService  *services.AlbumService
	configService *services.SiteConfigService
	uploadDir     string
	logger        *slog.Logger
}

// NewOGImageHandler creates a new OG image handler.
func NewOGImageHandler(
	albumService *services.AlbumService,
	configService *services.SiteConfigService,
	uploadDir string,
	logger *slog.Logger,
) *OGImageHandler {
	return &OGImageHandler{
		albumService:  albumService,
		configService: configService,
		uploadDir:     uploadDir,
		logger:        logger,
	}
}

// ServeOGImage serves the Open Graph image (portfolio album's cover photo).
func (h *OGImageHandler) ServeOGImage(w http.ResponseWriter, r *http.Request) {
	// Get site configuration to find main portfolio album
	config, err := h.configService.Get()
	if err != nil {
		h.logger.Error("failed to get site config", slog.String("error", err.Error()))
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// Get main portfolio album ID
	mainAlbumID := config.Portfolio.MainAlbumID
	if mainAlbumID == "" {
		// Fallback: get first public album
		albums, err := h.albumService.GetAll()
		if err != nil {
			h.logger.Error("failed to get albums", slog.String("error", err.Error()))
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}

		for _, album := range albums {
			if album.Visibility == "public" {
				mainAlbumID = album.ID
				break
			}
		}

		if mainAlbumID == "" {
			http.Error(w, "No portfolio album found", http.StatusNotFound)
			return
		}
	}

	// Get the album
	album, err := h.albumService.GetByID(mainAlbumID)
	if err != nil {
		h.logger.Error("failed to get portfolio album", slog.String("error", err.Error()))
		http.Error(w, "Album not found", http.StatusNotFound)
		return
	}

	// Get cover photo
	var coverPhotoURL string
	if album.CoverPhotoID != "" {
		// Find the cover photo
		for _, photo := range album.Photos {
			if photo.ID == album.CoverPhotoID {
				coverPhotoURL = photo.URLDisplay
				break
			}
		}
	}

	// Fallback to first photo if no cover photo set
	if coverPhotoURL == "" && len(album.Photos) > 0 {
		coverPhotoURL = album.Photos[0].URLDisplay
	}

	if coverPhotoURL == "" {
		http.Error(w, "No photos in portfolio album", http.StatusNotFound)
		return
	}

	// Remove leading slash from URL path
	// The URL will be like "/uploads/display/xxx.webp"
	imagePath := coverPhotoURL
	if len(imagePath) > 0 && imagePath[0] == '/' {
		imagePath = imagePath[1:]
	}

	// Construct full file path
	// imagePath is now like "uploads/display/xxx.webp"
	// uploadDir is like "../static/uploads"
	// We need to construct: workDir + uploadDir + "/display/xxx.webp"
	workDir, _ := os.Getwd()

	// Extract the part after "uploads/" from the URL
	relativePath := ""
	if len(imagePath) > len("uploads/") {
		relativePath = imagePath[len("uploads/"):]
	}

	fullPath := filepath.Join(workDir, h.uploadDir, relativePath)

	// Check if file exists
	if _, err := os.Stat(fullPath); os.IsNotExist(err) {
		h.logger.Error("og image file not found",
			slog.String("path", fullPath),
			slog.String("url", coverPhotoURL))
		http.Error(w, "Image not found", http.StatusNotFound)
		return
	}

	// Serve the image file
	http.ServeFile(w, r, fullPath)
}
