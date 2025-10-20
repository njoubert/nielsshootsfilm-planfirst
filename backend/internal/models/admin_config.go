package models

// AdminConfig represents the admin configuration stored in admin_config.json.
type AdminConfig struct {
	Username     string `json:"username"`
	PasswordHash string `json:"password_hash"`
}
