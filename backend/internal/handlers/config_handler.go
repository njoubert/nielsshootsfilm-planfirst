package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/njoubert/nielsshootsfilm-planfirst/backend/internal/models"
	"github.com/njoubert/nielsshootsfilm-planfirst/backend/internal/services"
)

// ConfigHandler handles site configuration requests.
type ConfigHandler struct {
	configService *services.SiteConfigService
	logger        *slog.Logger
}

// NewConfigHandler creates a new config handler.
func NewConfigHandler(configService *services.SiteConfigService, logger *slog.Logger) *ConfigHandler {
	return &ConfigHandler{
		configService: configService,
		logger:        logger,
	}
}

// Get returns the site configuration.
func (h *ConfigHandler) Get(w http.ResponseWriter, r *http.Request) {
	config, err := h.configService.Get()
	if err != nil {
		h.logger.Error("failed to get config", slog.String("error", err.Error()))
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	respondJSON(w, http.StatusOK, config)
}

// Update updates the site configuration.
func (h *ConfigHandler) Update(w http.ResponseWriter, r *http.Request) {
	var config models.SiteConfig
	if err := json.NewDecoder(r.Body).Decode(&config); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.configService.Update(&config); err != nil {
		h.logger.Error("failed to update config", slog.String("error", err.Error()))
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	respondJSON(w, http.StatusOK, config)
}

// SetMainPortfolioAlbum sets the main portfolio album.
func (h *ConfigHandler) SetMainPortfolioAlbum(w http.ResponseWriter, r *http.Request) {
	var req struct {
		AlbumID string `json:"album_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.configService.SetMainPortfolioAlbum(req.AlbumID); err != nil {
		h.logger.Error("failed to set main portfolio album", slog.String("error", err.Error()))
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
