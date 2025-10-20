package main

import (
	"fmt"
	"os"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	hash := "$2a$10$VPqUwu5tQ8xAsqdRFgzibeVQVewjXsBkKuhJClOVqpeGflWYwLZKm"
	password := "test123" // pragma: allowlist secret

	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	if err != nil {
		fmt.Println("❌ Password does NOT match hash")
		fmt.Println("Error:", err)
		os.Exit(1)
	}

	fmt.Println("✅ Password matches hash successfully!")
}
