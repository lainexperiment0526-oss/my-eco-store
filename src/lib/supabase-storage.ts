import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Supabase Storage Helper for Droplink
 * Handles all file uploads (images, documents, etc.) to Supabase Storage
 */

// Storage bucket names
export const STORAGE_BUCKETS = {
  PROFILE_IMAGES: 'profile-images',
  LOGOS: 'logos',
  PRODUCTS: 'product-images',
  DOCUMENTS: 'documents',
  AVATARS: 'avatars',
  THUMBNAILS: 'thumbnails',
  BACKGROUNDS: 'backgrounds',
  MESSAGE_IMAGES: 'message-images',
  MESSAGE_MEDIA: 'message-media',
} as const;

// Maximum file sizes (in bytes)
export const MAX_FILE_SIZES = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  DOCUMENT: 10 * 1024 * 1024, // 10MB
  VIDEO: 50 * 1024 * 1024, // 50MB
};

// Allowed file types
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

/**
 * Upload a file to Supabase Storage
 * @param file - File to upload
 * @param bucket - Storage bucket name
 * @param folder - Optional folder path within bucket
 * @param fileName - Optional custom filename
 * @returns Public URL of uploaded file
 */
export async function uploadFile(
  file: File,
  bucket: string,
  folder: string = '',
  fileName?: string
): Promise<{ url: string; path: string } | null> {
  try {
    // Validate file
    if (!file) {
      toast.error('No file selected');
      return null;
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExt = file.name.split('.').pop();
    const uniqueFileName = fileName || `${timestamp}_${randomString}.${fileExt}`;
    const filePath = folder ? `${folder}/${uniqueFileName}` : uniqueFileName;

    console.log('[Storage] Uploading file:', {
      bucket,
      path: filePath,
      size: file.size,
      type: file.type,
    });

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('[Storage] Upload error:', error);
      toast.error(`Upload failed: ${error.message}`);
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    console.log('[Storage] Upload successful:', publicUrl);
    toast.success('File uploaded successfully!');

    return {
      url: publicUrl,
      path: filePath,
    };
  } catch (error: any) {
    console.error('[Storage] Unexpected error:', error);
    toast.error('Failed to upload file');
    return null;
  }
}

/**
 * Upload an image file with validation
 * @param file - Image file to upload
 * @param bucket - Storage bucket name
 * @param folder - Optional folder path
 * @returns Public URL of uploaded image
 */
export async function uploadImage(
  file: File,
  bucket: string = STORAGE_BUCKETS.PROFILE_IMAGES,
  folder: string = ''
): Promise<{ url: string; path: string } | null> {
  // Validate file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    toast.error('Invalid file type. Please upload an image (JPEG, PNG, GIF, or WebP)');
    return null;
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZES.IMAGE) {
    toast.error('Image too large. Maximum size is 5MB');
    return null;
  }

  return uploadFile(file, bucket, folder);
}

/**
 * Upload any message media (image, video, audio) without strict type validation.
 * Validate type/size before calling this.
 */
export async function uploadMessageMedia(
  file: File,
  folder: string = ''
): Promise<{ url: string; path: string } | null> {
  return uploadFile(file, STORAGE_BUCKETS.MESSAGE_MEDIA, folder);
}

/**
 * Upload profile logo/avatar
 * @param file - Image file
 * @param userId - User ID for folder organization
 * @returns Public URL of uploaded logo
 */
export async function uploadProfileLogo(file: File, userId: string): Promise<string | null> {
  const result = await uploadImage(file, STORAGE_BUCKETS.LOGOS, userId);
  return result?.url || null;
}

/**
 * Upload profile avatar
 * @param file - Image file
 * @param userId - User ID for folder organization
 * @returns Public URL of uploaded avatar
 */
export async function uploadAvatar(file: File, userId: string): Promise<string | null> {
  const result = await uploadImage(file, STORAGE_BUCKETS.AVATARS, userId);
  return result?.url || null;
}

/**
 * Upload product image
 * @param file - Image file
 * @param productId - Product ID for folder organization
 * @returns Public URL of uploaded product image
 */
export async function uploadProductImage(file: File, productId: string): Promise<string | null> {
  const result = await uploadImage(file, STORAGE_BUCKETS.PRODUCTS, productId);
  return result?.url || null;
}

/**
 * Upload background image
 * @param file - Image file
 * @param userId - User ID for folder organization
 * @returns Public URL of uploaded background
 */
export async function uploadBackground(file: File, userId: string): Promise<string | null> {
  const result = await uploadImage(file, STORAGE_BUCKETS.BACKGROUNDS, userId);
  return result?.url || null;
}

/**
 * Delete a file from Supabase Storage
 * @param bucket - Storage bucket name
 * @param filePath - Path to file in bucket
 * @returns Success status
 */
export async function deleteFile(bucket: string, filePath: string): Promise<boolean> {
  try {
    console.log('[Storage] Deleting file:', { bucket, path: filePath });

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('[Storage] Delete error:', error);
      toast.error('Failed to delete file');
      return false;
    }

    console.log('[Storage] File deleted successfully');
    toast.success('File deleted successfully');
    return true;
  } catch (error: any) {
    console.error('[Storage] Unexpected error:', error);
    toast.error('Failed to delete file');
    return false;
  }
}

/**
 * Update file (delete old, upload new)
 * @param file - New file to upload
 * @param bucket - Storage bucket name
 * @param folder - Folder path
 * @param oldFilePath - Path to old file to delete
 * @returns Public URL of new file
 */
export async function updateFile(
  file: File,
  bucket: string,
  folder: string = '',
  oldFilePath?: string
): Promise<{ url: string; path: string } | null> {
  // Delete old file if exists
  if (oldFilePath) {
    await deleteFile(bucket, oldFilePath);
  }

  // Upload new file
  return uploadFile(file, bucket, folder);
}

/**
 * Get public URL for a file
 * @param bucket - Storage bucket name
 * @param filePath - Path to file in bucket
 * @returns Public URL
 */
export function getPublicUrl(bucket: string, filePath: string): string {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

/**
 * List files in a folder
 * @param bucket - Storage bucket name
 * @param folder - Folder path
 * @returns Array of file objects
 */
export async function listFiles(bucket: string, folder: string = '') {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      console.error('[Storage] List error:', error);
      return [];
    }

    return data || [];
  } catch (error: any) {
    console.error('[Storage] Unexpected error:', error);
    return [];
  }
}

/**
 * Create storage buckets if they don't exist
 * This should be run during initial setup
 */
export async function initializeStorageBuckets() {
  try {
    const buckets = Object.values(STORAGE_BUCKETS);
    
    for (const bucket of buckets) {
      const { error } = await supabase.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: MAX_FILE_SIZES.IMAGE,
      });

      if (error && !error.message.includes('already exists')) {
        console.error(`[Storage] Failed to create bucket ${bucket}:`, error);
      } else {
        console.log(`[Storage] Bucket ${bucket} ready`);
      }
    }

    return true;
  } catch (error: any) {
    console.error('[Storage] Initialization error:', error);
    return false;
  }
}

/**
 * Download a file from storage
 * @param bucket - Storage bucket name
 * @param filePath - Path to file in bucket
 * @returns Blob data
 */
export async function downloadFile(bucket: string, filePath: string): Promise<Blob | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(filePath);

    if (error) {
      console.error('[Storage] Download error:', error);
      toast.error('Failed to download file');
      return null;
    }

    return data;
  } catch (error: any) {
    console.error('[Storage] Unexpected error:', error);
    toast.error('Failed to download file');
    return null;
  }
}

/**
 * Compress image before upload (optional optimization)
 * @param file - Image file to compress
 * @param maxWidth - Maximum width
 * @param quality - JPEG quality (0-1)
 * @returns Compressed file
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
      };
    };
  });
}

/**
 * Upload message image/attachment
 * @param file - Image file
 * @returns Public URL of uploaded message image
 */
export async function uploadMessageImage(file: File): Promise<string | null> {
  const timestamp = Date.now();
  const result = await uploadImage(file, STORAGE_BUCKETS.MESSAGE_IMAGES, `messages/${timestamp}`);
  return result?.url || null;
}
