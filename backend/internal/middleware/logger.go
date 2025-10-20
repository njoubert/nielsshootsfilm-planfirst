package middleware

import (
	"log/slog"
	"net/http"
	"time"
)

// Logger middleware logs HTTP requests with structured logging.
func Logger(logger *slog.Logger) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()

			// Wrap response writer to capture status code
			ww := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}

			// Call next handler
			next.ServeHTTP(ww, r)

			// Log request details
			duration := time.Since(start)
			logger.Info("http request",
				slog.String("method", r.Method),
				slog.String("path", r.URL.Path),
				slog.Int("status", ww.statusCode),
				slog.Duration("duration", duration),
				slog.String("remote_addr", hashIP(r.RemoteAddr)),
				slog.String("user_agent", r.UserAgent()),
				slog.String("request_id", GetRequestID(r.Context())),
			)
		})
	}
}

// responseWriter wraps http.ResponseWriter to capture status code.
type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

// hashIP hashes IP address for privacy (simple hash for now).
func hashIP(ip string) string {
	// For MVP, just truncate to avoid logging full IPs
	if len(ip) > 10 {
		return ip[:10] + "..."
	}
	return ip
}
