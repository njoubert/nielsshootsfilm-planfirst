package main

import (
	"fmt"
	"os"

	"github.com/njoubert/nielsshootsfilm/backend/internal/services"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: hash-password <password>")
		os.Exit(1)
	}

	password := os.Args[1]

	hash, err := services.HashPassword(password)
	if err != nil {
		fmt.Printf("Error hashing password: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("Password hash:")
	fmt.Println(hash)
	fmt.Println()
	fmt.Println("Set this as the ADMIN_PASSWORD_HASH environment variable:")
	fmt.Printf("export ADMIN_PASSWORD_HASH='%s'\n", hash)
}
