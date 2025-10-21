package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/njoubert/nielsshootsfilm-planfirst/backend/internal/models"
	"github.com/njoubert/nielsshootsfilm-planfirst/backend/internal/services"
	"golang.org/x/crypto/bcrypt"
)

// AlbumHandler handles album-related HTTP requests.
type AlbumHandler struct {
	albumService *services.AlbumService
	imageService *services.ImageService
	logger       *slog.Logger
}

// NewAlbumHandler creates a new album handler.
func NewAlbumHandler(
	albumService *services.AlbumService,
	imageService *services.ImageService,
	logger *slog.Logger,
) *AlbumHandler {
	return &AlbumHandler{
		albumService: albumService,
		imageService: imageService,
		logger:       logger,
	}
}

// GetAll returns all albums.
func (h *AlbumHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	albums, err := h.albumService.GetAll()
	if err != nil {
		h.logger.Error("failed to get albums", slog.String("error", err.Error()))
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"albums": albums,
	})
}

// GetByID returns a single album by ID.
func (h *AlbumHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	album, err := h.albumService.GetByID(id)
	if err != nil {
		if err.Error() == "album not found" {
			http.Error(w, "Album not found", http.StatusNotFound)
			return
		}
		h.logger.Error("failed to get album", slog.String("error", err.Error()))
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	respondJSON(w, http.StatusOK, album)
}

// Create creates a new album.
func (h *AlbumHandler) Create(w http.ResponseWriter, r *http.Request) {
	var album models.Album
	if err := json.NewDecoder(r.Body).Decode(&album); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.albumService.Create(&album); err != nil {
		h.logger.Error("failed to create album", slog.String("error", err.Error()))
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	respondJSON(w, http.StatusCreated, album)
}

// Update updates an existing album.
func (h *AlbumHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var updates models.Album
	if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.albumService.Update(id, &updates); err != nil {
		h.logger.Error("failed to update album", slog.String("error", err.Error()))
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	respondJSON(w, http.StatusOK, updates)
}

// Delete deletes an album.
func (h *AlbumHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	// Get album to delete photos
	album, err := h.albumService.GetByID(id)
	if err != nil {
		if err.Error() == "album not found" {
			http.Error(w, "Album not found", http.StatusNotFound)
			return
		}
		h.logger.Error("failed to get album", slog.String("error", err.Error()))
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// Delete all photos from filesystem
	for _, photo := range album.Photos {
		if err := h.imageService.DeletePhoto(&photo); err != nil {
			h.logger.Warn("failed to delete photo file",
				slog.String("photo_id", photo.ID),
				slog.String("error", err.Error()),
			)
		}
	}

	// Delete album from JSON
	if err := h.albumService.Delete(id); err != nil {
		h.logger.Error("failed to delete album", slog.String("error", err.Error()))
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// UploadPhotos handles photo upload to an album.
func (h *AlbumHandler) UploadPhotos(w http.ResponseWriter, r *http.Request) {
	albumID := chi.URLParam(r, "id")

	// Verify album exists
	if _, err := h.albumService.GetByID(albumID); err != nil {
		if err.Error() == "album not found" {
			http.Error(w, "Album not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// Parse multipart form (max 5000 MB)
	if err := r.ParseMultipartForm(5000 << 20); err != nil {
		http.Error(w, "Failed to parse form", http.StatusBadRequest)
		return
	}

	files := r.MultipartForm.File["photos"]
	if len(files) == 0 {
		http.Error(w, "No files uploaded", http.StatusBadRequest)
		return
	}

	// Process each file
	uploadedPhotos := []models.Photo{}
	errors := []string{}

	for _, fileHeader := range files {
		photo, err := h.imageService.ProcessUpload(fileHeader)
		if err != nil {
			h.logger.Error("failed to process upload",
				slog.String("filename", fileHeader.Filename),
				slog.String("error", err.Error()),
			)
			errors = append(errors, fileHeader.Filename+": "+err.Error())
			continue
		}

		// Add photo to album
		if err := h.albumService.AddPhoto(albumID, photo); err != nil {
			h.logger.Error("failed to add photo to album",
				slog.String("filename", fileHeader.Filename),
				slog.String("error", err.Error()),
			)
			errors = append(errors, fileHeader.Filename+": "+err.Error())
			continue
		}

		uploadedPhotos = append(uploadedPhotos, *photo)
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"uploaded": uploadedPhotos,
		"errors":   errors,
	})
}

// DeletePhoto deletes a photo from an album.
func (h *AlbumHandler) DeletePhoto(w http.ResponseWriter, r *http.Request) {
	albumID := chi.URLParam(r, "id")
	photoID := chi.URLParam(r, "photoId")

	// Get album to find photo
	album, err := h.albumService.GetByID(albumID)
	if err != nil {
		http.Error(w, "Album not found", http.StatusNotFound)
		return
	}

	// Find photo
	var photo *models.Photo
	for i := range album.Photos {
		if album.Photos[i].ID == photoID {
			photo = &album.Photos[i]
			break
		}
	}

	if photo == nil {
		http.Error(w, "Photo not found", http.StatusNotFound)
		return
	}

	// Delete photo files
	if err := h.imageService.DeletePhoto(photo); err != nil {
		h.logger.Warn("failed to delete photo files",
			slog.String("photo_id", photoID),
			slog.String("error", err.Error()),
		)
	}

	// Delete photo from album
	if err := h.albumService.DeletePhoto(albumID, photoID); err != nil {
		h.logger.Error("failed to delete photo from album", slog.String("error", err.Error()))
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// SetPassword sets a password for an album.
func (h *AlbumHandler) SetPassword(w http.ResponseWriter, r *http.Request) {
	albumID := chi.URLParam(r, "id")

	var req struct {
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Get album
	album, err := h.albumService.GetByID(albumID)
	if err != nil {
		http.Error(w, "Album not found", http.StatusNotFound)
		return
	}

	// Hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		h.logger.Error("failed to hash password", slog.String("error", err.Error()))
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// Update album
	album.Visibility = "password_protected"
	album.PasswordHash = string(hash)

	if err := h.albumService.Update(albumID, album); err != nil {
		h.logger.Error("failed to update album", slog.String("error", err.Error()))
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// RemovePassword removes password protection from an album.
func (h *AlbumHandler) RemovePassword(w http.ResponseWriter, r *http.Request) {
	albumID := chi.URLParam(r, "id")

	// Get album
	album, err := h.albumService.GetByID(albumID)
	if err != nil {
		http.Error(w, "Album not found", http.StatusNotFound)
		return
	}

	// Update album
	album.Visibility = "public"
	album.PasswordHash = ""

	if err := h.albumService.Update(albumID, album); err != nil {
		h.logger.Error("failed to update album", slog.String("error", err.Error()))
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// SetCoverPhoto sets the cover photo for an album.
func (h *AlbumHandler) SetCoverPhoto(w http.ResponseWriter, r *http.Request) {
	albumID := chi.URLParam(r, "id")

	var req struct {
		PhotoID string `json:"photo_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.albumService.SetCoverPhoto(albumID, req.PhotoID); err != nil {
		h.logger.Error("failed to set cover photo", slog.String("error", err.Error()))
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// ReorderPhotos reorders photos in an album.
func (h *AlbumHandler) ReorderPhotos(w http.ResponseWriter, r *http.Request) {
	albumID := chi.URLParam(r, "id")

	var req struct {
		PhotoIDs []string `json:"photo_ids"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if len(req.PhotoIDs) == 0 {
		http.Error(w, "photo_ids array is required", http.StatusBadRequest)
		return
	}

	if err := h.albumService.ReorderPhotos(albumID, req.PhotoIDs); err != nil {
		h.logger.Error("failed to reorder photos", slog.String("error", err.Error()))
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// respondJSON writes a JSON response.
func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		// Log error but can't send another response
		slog.Error("failed to encode JSON response", slog.String("error", err.Error()))
	}
}
