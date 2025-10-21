/**
 * Admin API utilities for backend communication.
 * These functions interact with the Go admin server endpoints.
 */

import type { Album, SiteConfig } from '../types/data-models';

const API_BASE_URL = 'http://localhost:8080';

// ============================================================================
// Authentication
// ============================================================================

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  message: string;
}

/**
 * Login to admin panel.
 * Sets HTTP-only cookie on success.
 */
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Important: include cookies
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Login failed');
  }

  return response.json() as Promise<LoginResponse>;
}

/**
 * Logout from admin panel.
 */
export async function logout(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/admin/logout`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Logout failed');
  }
}

/**
 * Check if user is authenticated by calling the dedicated auth check endpoint.
 */
export async function checkAuth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/auth/check`, {
      method: 'GET',
      credentials: 'include',
    });

    return response.ok;
  } catch {
    return false;
  }
}

// ============================================================================
// Album Management
// ============================================================================

export interface CreateAlbumRequest {
  title: string;
  subtitle?: string;
  description?: string;
  visibility: 'public' | 'unlisted' | 'password_protected';
  allow_downloads?: boolean;
  order?: number;
}

export type UpdateAlbumRequest = Partial<Album>;

/**
 * Create a new album.
 */
export async function createAlbum(albumData: CreateAlbumRequest): Promise<Album> {
  const response = await fetch(`${API_BASE_URL}/api/admin/albums`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(albumData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to create album');
  }

  return response.json() as Promise<Album>;
}

/**
 * Update an existing album.
 * Note: Backend requires full album object, so fetch first, then update.
 */
export async function updateAlbum(albumId: string, updates: UpdateAlbumRequest): Promise<Album> {
  // Fetch current album data
  const currentAlbum = await fetchAlbumById(albumId);

  // Merge updates with current data
  const updatedAlbum = { ...currentAlbum, ...updates };

  const response = await fetch(`${API_BASE_URL}/api/admin/albums/${albumId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(updatedAlbum),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to update album');
  }

  return response.json() as Promise<Album>;
}

/**
 * Delete an album.
 */
export async function deleteAlbum(albumId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/admin/albums/${albumId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to delete album');
  }
}

/**
 * Fetch album by ID (from public API).
 */
export async function fetchAlbumById(albumId: string): Promise<Album> {
  const response = await fetch(`${API_BASE_URL}/api/albums/${albumId}`);

  if (!response.ok) {
    throw new Error('Album not found');
  }

  return response.json() as Promise<Album>;
}

/**
 * Fetch all albums (from public API).
 */
export async function fetchAllAlbums(): Promise<Album[]> {
  const response = await fetch(`${API_BASE_URL}/api/albums`);

  if (!response.ok) {
    throw new Error('Failed to fetch albums');
  }

  const data = (await response.json()) as { albums: Album[] };
  return data.albums;
}

// ============================================================================
// Photo Management
// ============================================================================

export interface UploadPhotosResponse {
  uploaded: Array<{
    id: string;
    filename_original: string;
    url_thumbnail: string;
  }>;
  errors: string[];
}

/**
 * Upload photos to an album.
 */
export async function uploadPhotos(albumId: string, files: File[]): Promise<UploadPhotosResponse> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('photos', file);
  });

  const response = await fetch(`${API_BASE_URL}/api/admin/albums/${albumId}/photos/upload`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    // Try to get detailed error message
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const errorData = (await response.json()) as { error?: string; message?: string };
      throw new Error(errorData.error || errorData.message || 'Failed to upload photos');
    } else {
      const error = await response.text();
      throw new Error(error || 'Failed to upload photos');
    }
  }

  return response.json() as Promise<UploadPhotosResponse>;
}

/**
 * Delete a photo from an album.
 */
export async function deletePhoto(albumId: string, photoId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/admin/albums/${albumId}/photos/${photoId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to delete photo');
  }
}

/**
 * Set album cover photo.
 */
export async function setCoverPhoto(albumId: string, photoId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/admin/albums/${albumId}/set-cover`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ photo_id: photoId }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to set cover photo');
  }
}

/**
 * Reorder photos in an album.
 */
export async function reorderPhotos(albumId: string, photoIds: string[]): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/admin/albums/${albumId}/reorder-photos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ photo_ids: photoIds }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to reorder photos');
  }
}

/**
 * Set password for password-protected album.
 */
export async function setAlbumPassword(albumId: string, password: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/admin/albums/${albumId}/set-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ password }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to set album password');
  }
}

/**
 * Remove password from album.
 */
export async function removeAlbumPassword(albumId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/admin/albums/${albumId}/password`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to remove album password');
  }
}

// ============================================================================
// Site Configuration
// ============================================================================

/**
 * Update site configuration.
 */
export async function updateSiteConfig(config: Partial<SiteConfig>): Promise<SiteConfig> {
  const response = await fetch(`${API_BASE_URL}/api/admin/config`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to update site config');
  }

  return response.json() as Promise<SiteConfig>;
}

/**
 * Set main portfolio album.
 */
export async function setMainPortfolioAlbum(albumId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/admin/config/main-portfolio-album`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ album_id: albumId }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to set main portfolio album');
  }
}

/**
 * Change admin password.
 */
export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/admin/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      old_password: oldPassword,
      new_password: newPassword,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to change password');
  }
}
