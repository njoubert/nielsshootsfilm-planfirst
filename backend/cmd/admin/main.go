package main

import (
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/njoubert/nielsshootsfilm-planfirst/backend/internal/handlers"
	"github.com/njoubert/nielsshootsfilm-planfirst/backend/internal/middleware"
	"github.com/njoubert/nielsshootsfilm-planfirst/backend/internal/models"
	"github.com/njoubert/nielsshootsfilm-planfirst/backend/internal/services"
)

func main() {
	// Setup structured logging
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))

	// Get configuration from environment
	dataDir := getEnv("DATA_DIR", "../data")
	uploadDir := getEnv("UPLOAD_DIR", "../static/uploads")
	port := getEnv("PORT", "8080")

	// Initialize services
	fileService, err := services.NewFileService(dataDir)
	if err != nil {
		logger.Error("failed to create file service", slog.String("error", err.Error()))
		os.Exit(1)
	}

	// Load admin configuration from file
	var adminConfig models.AdminConfig
	if err := fileService.ReadJSON("admin_config.json", &adminConfig); err != nil {
		logger.Error("failed to load admin config",
			slog.String("error", err.Error()),
			slog.String("hint", "run ./scripts/bootstrap.sh to create admin_config.json"),
		)
		os.Exit(1)
	}

	// Allow environment variables to override config file
	adminUsername := getEnv("ADMIN_USERNAME", adminConfig.Username)
	adminPasswordHash := getEnv("ADMIN_PASSWORD_HASH", adminConfig.PasswordHash)

	if adminPasswordHash == "" {
		logger.Error("admin password hash not configured",
			slog.String("hint", "run ./scripts/bootstrap.sh to set admin password"),
		)
		os.Exit(1)
	}

	albumService := services.NewAlbumService(fileService)
	configService := services.NewSiteConfigService(fileService)

	imageService, err := services.NewImageService(uploadDir)
	if err != nil {
		logger.Error("failed to create image service", slog.String("error", err.Error()))
		os.Exit(1)
	}

	// Initialize auth service (24 hour session TTL)
	authService := services.NewAuthService(adminUsername, adminPasswordHash, 24*time.Hour)

	// Initialize handlers
	albumHandler := handlers.NewAlbumHandler(albumService, imageService, logger)
	authHandler := handlers.NewAuthHandler(authService, logger)
	configHandler := handlers.NewConfigHandler(configService, logger)

	// Start session cleanup goroutine
	authHandler.StartSessionCleanup()

	// Setup router
	r := chi.NewRouter()

	// Global middleware
	r.Use(middleware.RequestID)
	r.Use(middleware.Recoverer(logger))
	r.Use(middleware.Logger(logger))
	r.Use(middleware.SecurityHeaders)

	// CORS middleware (allow frontend in development)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-Request-ID"},
		ExposedHeaders:   []string{"X-Request-ID"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Health check endpoint (public)
	r.Get("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})

	// Public API endpoints (for frontend)
	r.Route("/api", func(r chi.Router) {
		// Public album endpoints
		r.Get("/albums", albumHandler.GetAll)
		r.Get("/albums/{id}", albumHandler.GetByID)

		// Public site config
		r.Get("/config", configHandler.Get)
	})

	// Admin API endpoints (require authentication)
	r.Route("/api/admin", func(r chi.Router) {
		// Auth endpoints (no auth required for login)
		r.Post("/login", authHandler.Login)
		r.Post("/logout", authHandler.Logout)

		// Protected admin routes
		r.Group(func(r chi.Router) {
			r.Use(middleware.Auth(authService, logger))

			// Album management
			r.Post("/albums", albumHandler.Create)
			r.Put("/albums/{id}", albumHandler.Update)
			r.Delete("/albums/{id}", albumHandler.Delete)
			r.Post("/albums/{id}/photos/upload", albumHandler.UploadPhotos)
			r.Delete("/albums/{id}/photos/{photoId}", albumHandler.DeletePhoto)
			r.Post("/albums/{id}/set-cover", albumHandler.SetCoverPhoto)
			r.Post("/albums/{id}/set-password", albumHandler.SetPassword)
			r.Delete("/albums/{id}/password", albumHandler.RemovePassword)

			// Site configuration
			r.Put("/config", configHandler.Update)
			r.Put("/config/main-portfolio-album", configHandler.SetMainPortfolioAlbum)

			// Auth management
			r.Post("/change-password", authHandler.ChangePassword)
		})
	})

	// Serve static files (uploaded images)
	workDir, _ := os.Getwd()
	staticPath := filepath.Join(workDir, uploadDir)
	r.Handle("/uploads/*", http.StripPrefix("/uploads/", http.FileServer(http.Dir(staticPath))))

	// Start server
	addr := ":" + port
	logger.Info("admin server starting",
		slog.String("addr", addr),
		slog.String("data_dir", dataDir),
		slog.String("upload_dir", uploadDir),
	)

	server := &http.Server{
		Addr:         addr,
		Handler:      r,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	if err := server.ListenAndServe(); err != nil {
		logger.Error("server failed", slog.String("error", err.Error()))
		os.Exit(1)
	}
}

// getEnv gets an environment variable with a default value.
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
