import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

/**
 * Upload single file to S3
 * @param file - File to upload
 * @param folder - Optional folder name (e.g., 'hero-banners', 'news', 'projects')
 * @returns Promise with upload response
 */
export const uploadFile = async (
  file: File,
  folder?: string
): Promise<{
  url: string;
  key: string;
  publicId: string;
  originalName: string;
  mimeType: string;
  size: number;
}> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (folder) {
      formData.append('folder', folder);
    }

    const token = localStorage.getItem('accessToken');

    const response = await axios.post(`${API_URL}/upload/single`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data.data;
  } catch (error: any) {
    console.error('File upload error:', error);
    throw new Error(error.response?.data?.message || 'File upload failed');
  }
};

/**
 * Upload multiple files to S3
 * @param files - Array of files to upload
 * @param folder - Optional folder name
 * @returns Promise with upload responses
 */
export const uploadMultipleFiles = async (
  files: File[],
  folder?: string
): Promise<
  Array<{
    url: string;
    key: string;
    publicId: string;
    originalName: string;
    mimeType: string;
    size: number;
  }>
> => {
  try {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    if (folder) {
      formData.append('folder', folder);
    }

    const token = localStorage.getItem('accessToken');

    const response = await axios.post(`${API_URL}/upload/multiple`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data.data;
  } catch (error: any) {
    console.error('Multiple files upload error:', error);
    throw new Error(error.response?.data?.message || 'Files upload failed');
  }
};

/**
 * Delete file from S3
 * @param key - File key in S3
 * @returns Promise<void>
 */
export const deleteFile = async (key: string): Promise<void> => {
  try {
    const token = localStorage.getItem('accessToken');

    await axios.delete(`${API_URL}/upload`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: { key },
    });
  } catch (error: any) {
    console.error('File deletion error:', error);
    throw new Error(error.response?.data?.message || 'File deletion failed');
  }
};

/**
 * Refresh presigned URL for a file
 * @param key - File key in S3
 * @returns Promise with new URL
 */
export const refreshFileUrl = async (key: string): Promise<string> => {
  try {
    const token = localStorage.getItem('accessToken');

    const response = await axios.post(
      `${API_URL}/upload/refresh-url`,
      { key },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data.data.url;
  } catch (error: any) {
    console.error('URL refresh error:', error);
    throw new Error(error.response?.data?.message || 'URL refresh failed');
  }
};