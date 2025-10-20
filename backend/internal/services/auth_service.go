package services

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"log/slog"
	"sync"
	"time"

	"golang.org/x/crypto/bcrypt"
)

// Session represents an authenticated session.
type Session struct {
	ID        string
	Username  string
	CreatedAt time.Time
	ExpiresAt time.Time
}

// AuthService handles authentication and session management.
type AuthService struct {
	username     string
	passwordHash string
	sessions     map[string]*Session
	mu           sync.RWMutex
	sessionTTL   time.Duration
}

// NewAuthService creates a new auth service.
func NewAuthService(username, passwordHash string, sessionTTL time.Duration) *AuthService { // pragma: allowlist secret
	return &AuthService{
		username:     username,
		passwordHash: passwordHash, // pragma: allowlist secret
		sessions:     make(map[string]*Session),
		sessionTTL:   sessionTTL,
	}
}

// Authenticate verifies credentials and creates a session.
func (s *AuthService) Authenticate(username, password string) (string, error) { // pragma: allowlist secret
	// Debug logging
	slog.Info("authenticate attempt",
		slog.String("username", username),
		slog.String("stored_username", s.username),
		slog.Int("hash_length", len(s.passwordHash)),
		slog.Int("password_length", len(password)),
	)

	// Check username
	if username != s.username {
		slog.Warn("username mismatch")
		return "", errors.New("invalid credentials")
	}

	// Check password
	if err := bcrypt.CompareHashAndPassword([]byte(s.passwordHash), []byte(password)); err != nil {
		slog.Warn("password hash comparison failed", slog.String("error", err.Error()))
		return "", errors.New("invalid credentials")
	}

	// Create session
	sessionID, err := generateSessionID()
	if err != nil {
		return "", fmt.Errorf("failed to generate session ID: %w", err)
	}

	session := &Session{
		ID:        sessionID,
		Username:  username,
		CreatedAt: time.Now(),
		ExpiresAt: time.Now().Add(s.sessionTTL),
	}

	s.mu.Lock()
	s.sessions[sessionID] = session
	s.mu.Unlock()

	return sessionID, nil
}

// ValidateSession checks if a session is valid and extends it.
func (s *AuthService) ValidateSession(sessionID string) (*Session, error) {
	s.mu.RLock()
	session, exists := s.sessions[sessionID]
	s.mu.RUnlock()

	if !exists {
		return nil, errors.New("invalid session")
	}

	// Check if expired
	if time.Now().After(session.ExpiresAt) {
		s.mu.Lock()
		delete(s.sessions, sessionID)
		s.mu.Unlock()
		return nil, errors.New("session expired")
	}

	// Extend session
	s.mu.Lock()
	session.ExpiresAt = time.Now().Add(s.sessionTTL)
	s.mu.Unlock()

	return session, nil
}

// InvalidateSession removes a session (logout).
func (s *AuthService) InvalidateSession(sessionID string) {
	s.mu.Lock()
	defer s.mu.Unlock()

	delete(s.sessions, sessionID)
}

// CleanupExpiredSessions removes expired sessions.
func (s *AuthService) CleanupExpiredSessions() {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now()
	for id, session := range s.sessions {
		if now.After(session.ExpiresAt) {
			delete(s.sessions, id)
		}
	}
}

// ChangePassword updates the admin password.
func (s *AuthService) ChangePassword(oldPassword, newPassword string) error {
	// Verify old password
	if err := bcrypt.CompareHashAndPassword([]byte(s.passwordHash), []byte(oldPassword)); err != nil {
		return errors.New("invalid current password")
	}

	// Hash new password
	newHash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	s.passwordHash = string(newHash)

	return nil
}

// generateSessionID generates a cryptographically secure session ID.
func generateSessionID() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

// HashPassword hashes a password using bcrypt.
func HashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hash), nil
}
