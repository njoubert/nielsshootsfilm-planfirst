/**
 * Admin API utilities for backend communication.
 * These functions interact with the Go admin server endpoints.
 */

import type { Album, SiteConfig } from '../types/data-models';
import { dispatchLoginEvent, dispatchLogoutEvent } from './auth-state';

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

  const result = (await response.json()) as Promise<LoginResponse>;

  // Dispatch login event to notify components
  dispatchLoginEvent();

  return result;
}

/**
 * Logout from admin panel.
 * Clears HTTP-only cookie and dispatches logout event.
 */
export async function logout(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/admin/logout`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Logout failed');
  }

  // Dispatch logout event to notify all admin components to clear their state
  dispatchLogoutEvent();
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

export interface UploadProgress {
  filename: string;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  progress: number; // 0-100 for uploading, undefined for other states
  error?: string;
}

export interface UploadProgressCallback {
  (progress: UploadProgress): void;
}

/**
 * Upload a single photo to an album using XMLHttpRequest for real progress tracking.
 * @returns Promise that resolves with the uploaded photo data or rejects with error
 */
function uploadSinglePhoto(
  albumId: string,
  file: File,
  onProgress: UploadProgressCallback
): Promise<{ id: string; filename_original: string; url_thumbnail: string }> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('photos', file);

    const xhr = new XMLHttpRequest();

    // Track upload progress (0-100%)
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = Math.round((e.loaded / e.total) * 100);
        onProgress({
          filename: file.name,
          status: 'uploading',
          progress: percentComplete,
        });
      }
    });

    // Upload complete, now processing on server
    xhr.upload.addEventListener('load', () => {
      onProgress({
        filename: file.name,
        status: 'processing',
        progress: 100,
      });
    });

    // Handle response from server
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText) as UploadPhotosResponse;
          if (response.uploaded && response.uploaded.length > 0) {
            onProgress({
              filename: file.name,
              status: 'complete',
              progress: 100,
            });
            resolve(response.uploaded[0]);
          } else if (response.errors && response.errors.length > 0) {
            onProgress({
              filename: file.name,
              status: 'error',
              progress: 0,
              error: response.errors[0],
            });
            reject(new Error(response.errors[0]));
          } else {
            onProgress({
              filename: file.name,
              status: 'error',
              progress: 0,
              error: 'Unknown error',
            });
            reject(new Error('Unknown error'));
          }
        } catch {
          onProgress({
            filename: file.name,
            status: 'error',
            progress: 0,
            error: 'Failed to parse response',
          });
          reject(new Error('Failed to parse server response'));
        }
      } else {
        // HTTP error
        let errorMessage = `Upload failed (${xhr.status})`;
        try {
          const contentType = xhr.getResponseHeader('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = JSON.parse(xhr.responseText) as { error?: string; message?: string };
            errorMessage = errorData.error || errorData.message || errorMessage;
          } else {
            errorMessage = xhr.responseText || errorMessage;
          }
        } catch {
          // Ignore parse errors, use default message
        }

        onProgress({
          filename: file.name,
          status: 'error',
          progress: 0,
          error: errorMessage,
        });
        reject(new Error(errorMessage));
      }
    });

    // Handle network errors
    xhr.addEventListener('error', () => {
      onProgress({
        filename: file.name,
        status: 'error',
        progress: 0,
        error: 'Network error',
      });
      reject(new Error('Network error'));
    });

    // Handle aborted uploads
    xhr.addEventListener('abort', () => {
      onProgress({
        filename: file.name,
        status: 'error',
        progress: 0,
        error: 'Upload cancelled',
      });
      reject(new Error('Upload cancelled'));
    });

    // Open and send request
    xhr.open('POST', `${API_BASE_URL}/api/admin/albums/${albumId}/photos/upload`);
    xhr.withCredentials = true; // Include cookies for authentication
    xhr.send(formData);
  });
}

/**
 * Upload photos to an album with real progress tracking.
 * Uploads files concurrently (up to 3 at a time) with per-file progress callbacks.
 *
 * @param albumId - The album ID to upload to
 * @param files - Array of files to upload
 * @param onProgress - Optional callback for tracking upload progress per file
 * @param concurrency - Maximum number of concurrent uploads (default: 3)
 * @returns Promise that resolves with aggregated upload results
 */
export async function uploadPhotos(
  albumId: string,
  files: File[],
  onProgress?: UploadProgressCallback,
  concurrency = 3
): Promise<UploadPhotosResponse> {
  const uploaded: Array<{ id: string; filename_original: string; url_thumbnail: string }> = [];
  const errors: string[] = [];

  // Helper to process a single file
  const processFile = async (file: File) => {
    try {
      const result = await uploadSinglePhoto(albumId, file, (progress) => {
        if (onProgress) {
          onProgress(progress);
        }
      });
      uploaded.push(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`${file.name}: ${errorMessage}`);
    }
  };

  // Process files with concurrency limit
  const queue = [...files];
  const active = new Set<Promise<void>>();

  while (queue.length > 0 || active.size > 0) {
    // Fill up to concurrency limit
    while (active.size < concurrency && queue.length > 0) {
      const file = queue.shift()!;
      const promise = processFile(file).finally(() => {
        active.delete(promise);
      });
      active.add(promise);
    }

    // Wait for at least one to complete before continuing
    if (active.size > 0) {
      await Promise.race(active);
    }
  }

  return { uploaded, errors };
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
