package services

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupAuthService(t *testing.T) *AuthService {
	// Create an auth service with a test password hash
	// Password is "test123"
	// pragma: allowlist secret
	testHash := "$2a$10$VPqUwu5tQ8xAsqdRFgzibeVQVewjXsBkKuhJClOVqpeGflWYwLZKm"
	return NewAuthService("testuser", testHash, 24*time.Hour)
}

func TestNewAuthService(t *testing.T) {
	service := setupAuthService(t)
	assert.NotNil(t, service)
}

func TestAuthService_Authenticate_Success(t *testing.T) {
	service := setupAuthService(t)

	sessionID, err := service.Authenticate("testuser", "test123")
	require.NoError(t, err)
	assert.NotEmpty(t, sessionID)
}

func TestAuthService_Authenticate_WrongUsername(t *testing.T) {
	service := setupAuthService(t)

	_, err := service.Authenticate("wronguser", "test123")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid credentials")
}

func TestAuthService_Authenticate_WrongPassword(t *testing.T) {
	service := setupAuthService(t)

	_, err := service.Authenticate("testuser", "wrongpassword")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid credentials")
}

func TestAuthService_ValidateSession_Valid(t *testing.T) {
	service := setupAuthService(t)

	// Create a session
	sessionID, err := service.Authenticate("testuser", "test123")
	require.NoError(t, err)

	// Validate it
	session, err := service.ValidateSession(sessionID)
	require.NoError(t, err)
	assert.NotNil(t, session)
	assert.Equal(t, "testuser", session.Username)
}

func TestAuthService_ValidateSession_Invalid(t *testing.T) {
	service := setupAuthService(t)

	_, err := service.ValidateSession("nonexistent-session-id")
	assert.Error(t, err)
}

func TestAuthService_ValidateSession_Expired(t *testing.T) {
	service := setupAuthService(t)

	// Create a session
	sessionID, err := service.Authenticate("testuser", "test123")
	require.NoError(t, err)

	// Manually expire the session by setting its time to the past
	service.mu.Lock()
	if sess, exists := service.sessions[sessionID]; exists {
		sess.ExpiresAt = time.Now().Add(-1 * time.Hour)
		service.sessions[sessionID] = sess
	}
	service.mu.Unlock()

	// Validate should fail
	_, err = service.ValidateSession(sessionID)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "expired")
}

func TestAuthService_InvalidateSession(t *testing.T) {
	service := setupAuthService(t)

	// Create a session
	sessionID, err := service.Authenticate("testuser", "test123")
	require.NoError(t, err)

	// Validate it works
	_, err = service.ValidateSession(sessionID)
	require.NoError(t, err)

	// Invalidate it
	service.InvalidateSession(sessionID)

	// Should no longer be valid
	_, err = service.ValidateSession(sessionID)
	assert.Error(t, err)
}

func TestAuthService_ChangePassword(t *testing.T) {
	service := setupAuthService(t)

	// Change password
	err := service.ChangePassword("test123", "newpassword456")
	require.NoError(t, err)

	// Old password should not work
	_, err = service.Authenticate("testuser", "test123")
	assert.Error(t, err)

	// New password should work
	sessionID, err := service.Authenticate("testuser", "newpassword456")
	require.NoError(t, err)
	assert.NotEmpty(t, sessionID)
}

func TestAuthService_ChangePassword_WrongOldPassword(t *testing.T) {
	service := setupAuthService(t)

	err := service.ChangePassword("wrongpassword", "newpassword456")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid current password")
}

func TestAuthService_SessionCleanup(t *testing.T) {
	service := setupAuthService(t)

	// Create a session
	sessionID, err := service.Authenticate("testuser", "test123")
	require.NoError(t, err)

	// Manually expire it
	service.mu.Lock()
	if sess, exists := service.sessions[sessionID]; exists {
		sess.ExpiresAt = time.Now().Add(-1 * time.Hour)
		service.sessions[sessionID] = sess
	}
	service.mu.Unlock()

	// Try to validate expired session (this will clean it up)
	_, err = service.ValidateSession(sessionID)
	assert.Error(t, err)

	// Session should be gone after validation attempt
	service.mu.RLock()
	_, exists := service.sessions[sessionID]
	service.mu.RUnlock()

	assert.False(t, exists)
}

func TestAuthService_HashPassword(t *testing.T) {
	hash, err := HashPassword("mypassword")
	require.NoError(t, err)
	assert.NotEmpty(t, hash)
	assert.Contains(t, hash, "$2a$")

	// Verify the hash works
	service := NewAuthService("testuser", hash, 24*time.Hour)
	sessionID, err := service.Authenticate("testuser", "mypassword")
	require.NoError(t, err)
	assert.NotEmpty(t, sessionID)
}

func TestAuthService_MultipleActiveSessions(t *testing.T) {
	service := setupAuthService(t)

	// Create multiple sessions
	session1, err := service.Authenticate("testuser", "test123")
	require.NoError(t, err)

	session2, err := service.Authenticate("testuser", "test123")
	require.NoError(t, err)

	// Both should be valid
	_, err = service.ValidateSession(session1)
	assert.NoError(t, err)

	_, err = service.ValidateSession(session2)
	assert.NoError(t, err)

	// Invalidate one
	service.InvalidateSession(session1)

	// First should be invalid, second still valid
	_, err = service.ValidateSession(session1)
	assert.Error(t, err)

	_, err = service.ValidateSession(session2)
	assert.NoError(t, err)
}
