package services

import (
	"testing"
)

func TestDetectContentType(t *testing.T) {
	tests := []struct {
		name     string
		data     []byte
		filename string
		want     string
	}{
		{
			name:     "HEIC file with heic brand",
			data:     []byte{0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63},
			filename: "photo.heic",
			want:     "image/heic",
		},
		{
			name:     "HEIC file with heix brand",
			data:     []byte{0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x78},
			filename: "photo.heic",
			want:     "image/heic",
		},
		{
			name:     "HEIF file with mif1 brand and .heif extension",
			data:     []byte{0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6d, 0x69, 0x66, 0x31},
			filename: "photo.heif",
			want:     "image/heif",
		},
		{
			name:     "HEIC file with mif1 brand and .heic extension",
			data:     []byte{0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6d, 0x69, 0x66, 0x31},
			filename: "photo.heic",
			want:     "image/heic",
		},
		{
			name:     "JPEG file",
			data:     []byte{0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01},
			filename: "photo.jpg",
			want:     "image/jpeg",
		},
		{
			name:     "PNG file",
			data:     []byte{0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D},
			filename: "photo.png",
			want:     "image/png",
		},
		{
			name:     "Too short data",
			data:     []byte{0x00, 0x00, 0x00},
			filename: "photo.heic",
			want:     "application/octet-stream",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := detectContentType(tt.data, tt.filename)
			if got != tt.want {
				t.Errorf("detectContentType() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestValidateFilename(t *testing.T) {
	tests := []struct {
		name     string
		filename string
		wantErr  bool
	}{
		{
			name:     "Valid filename",
			filename: "photo.jpg",
			wantErr:  false,
		},
		{
			name:     "Valid filename with UUID",
			filename: "123e4567-e89b-12d3-a456-426614174000.heic",
			wantErr:  false,
		},
		{
			name:     "Path traversal with ..",
			filename: "../etc/passwd",
			wantErr:  true,
		},
		{
			name:     "Path traversal with /",
			filename: "path/to/file.jpg",
			wantErr:  true,
		},
		{
			name:     "Path traversal with backslash",
			filename: "path\\to\\file.jpg",
			wantErr:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateFilename(tt.filename)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateFilename() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}
