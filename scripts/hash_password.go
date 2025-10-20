package main

import (
	"fmt"
	"os"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	if len(os.Args) != 2 {
		fmt.Fprintf(os.Stderr, "Usage: %s <password>\n", os.Args[0])
		os.Exit(1)
	}

	password := os.Args[1]

	if password == "" {
		fmt.Fprintln(os.Stderr, "Error: password cannot be empty")
		os.Exit(1)
	}

	// Generate bcrypt hash with cost of 12
	hash, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error generating hash: %v\n", err)
		os.Exit(1)
	}

	// Output just the hash (no newline for easy piping)
	fmt.Print(string(hash))
}
