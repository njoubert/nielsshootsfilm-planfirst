package middleware

import (
	"context"
	"log/slog"
	"net/http"

	"github.com/njoubert/nielsshootsfilm/backend/internal/services"
)

type authContextKey string

const sessionKey authContextKey = "session"

// Auth middleware validates session and requires authentication.
func Auth(authService *services.AuthService, logger *slog.Logger) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Get session ID from cookie
			cookie, err := r.Cookie("photoadmin_session")
			if err != nil {
				logger.Warn("missing session cookie",
					slog.String("path", r.URL.Path),
					slog.String("request_id", GetRequestID(r.Context())),
				)
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}

			// Validate session
			session, err := authService.ValidateSession(cookie.Value)
			if err != nil {
				logger.Warn("invalid session",
					slog.String("error", err.Error()),
					slog.String("path", r.URL.Path),
					slog.String("request_id", GetRequestID(r.Context())),
				)
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}

			// Add session to context
			ctx := context.WithValue(r.Context(), sessionKey, session)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetSession retrieves the session from context.
func GetSession(ctx context.Context) *services.Session {
	if session, ok := ctx.Value(sessionKey).(*services.Session); ok {
		return session
	}
	return nil
}
