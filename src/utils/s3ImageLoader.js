// S3 Image Loader Utility for KHPL Static Assets
// Loads images from S3 bucket with fallbacks

import React from 'react';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

// AWS S3 Configuration for static assets
const S3_CONFIG = {
  region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
  bucketName: process.env.REACT_APP_S3_BUCKET_NAME || 'khpl-registration-data',
  accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
  enabled: process.env.REACT_APP_S3_STORAGE === 'true'
};

// Initialize S3 Client
let s3Client = null;

const initializeS3Client = () => {
  if (!S3_CONFIG.enabled || !S3_CONFIG.accessKeyId || !S3_CONFIG.secretAccessKey) {
    return null;
  }

  try {
    s3Client = new S3Client({
      region: S3_CONFIG.region,
      credentials: {
        accessKeyId: S3_CONFIG.accessKeyId,
        secretAccessKey: S3_CONFIG.secretAccessKey,
      },
    });
    return s3Client;
  } catch (error) {
    console.error('Failed to initialize S3 client for images:', error);
    return null;
  }
};

// Cache for loaded images
const imageCache = new Map();

// Load image from S3
export const loadImageFromS3 = async (imageName) => {
  // TEMPORARY: Disable S3 loading due to CORS issues, use local images only
  console.log(`🔄 Loading image from public folder: ${imageName}`);
  
  // Use proper URL construction for production and development
  const publicUrl = process.env.PUBLIC_URL || '';
  const localUrl = `${publicUrl}/${imageName}`;
  
  imageCache.set(imageName, localUrl);
  return localUrl;

  // TODO: Re-enable S3 loading after CORS is properly configured
  /* 
  // If S3 not configured, return fallback path
  if (!S3_CONFIG.enabled || !S3_CONFIG.accessKeyId) {
    console.log(`S3 not configured, using fallback for: ${imageName}`);
    return process.env.PUBLIC_URL + `/${imageName}`;
  }

  // Check cache first
  if (imageCache.has(imageName)) {
    return imageCache.get(imageName);
  }

  // Use direct S3 URL (only if CORS is configured)
  const publicS3Url = `https://${S3_CONFIG.bucketName}.s3.amazonaws.com/images/${imageName}`;
  
  console.log(`✅ Using S3 URL for: ${imageName}`);
  imageCache.set(imageName, publicS3Url);
  return publicS3Url;
  */
};

// Get S3 image URL (direct URL without loading)
export const getS3ImageUrl = (imageName) => {
  if (!S3_CONFIG.enabled || !S3_CONFIG.accessKeyId) {
    return process.env.PUBLIC_URL + `/${imageName}`;
  }

  // Use standard S3 URL format
  const s3Url = `https://${S3_CONFIG.bucketName}.s3.amazonaws.com/images/${imageName}`;
  return s3Url;
};

// Preload essential images
export const preloadEssentialImages = async () => {
  const essentialImages = ['khpl.jpeg', 'KHPL-QR-CODE.jpeg'];
  
  console.log('🖼️ Preloading essential KHPL images from S3...');
  
  const promises = essentialImages.map(async (imageName) => {
    try {
      const url = await loadImageFromS3(imageName);
      console.log(`✅ Preloaded: ${imageName}`);
      return { imageName, url, success: true };
    } catch (error) {
      console.warn(`❌ Failed to preload: ${imageName}`, error.message);
      return { imageName, url: null, success: false };
    }
  });

  const results = await Promise.allSettled(promises);
  
  const successful = results.filter(result => 
    result.status === 'fulfilled' && result.value.success
  ).length;
  
  console.log(`📸 Preloaded ${successful}/${essentialImages.length} images from S3`);
  return results;
};

// Hook for React components to load images
export const useS3Image = (imageName) => {
  const [imageUrl, setImageUrl] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const loadImage = async () => {
      try {
        setLoading(true);
        setError(null);
        const url = await loadImageFromS3(imageName);
        setImageUrl(url);
      } catch (err) {
        setError(err.message);
        // Set fallback URL
        setImageUrl(process.env.PUBLIC_URL + `/${imageName}`);
      } finally {
        setLoading(false);
      }
    };

    if (imageName) {
      loadImage();
    }
  }, [imageName]);

  return { imageUrl, loading, error };
};

// Upload image to S3 (for admin use)
export const uploadImageToS3 = async (imageFile, imageName) => {
  const client = initializeS3Client();
  
  if (!client) {
    throw new Error('S3 not configured - cannot upload images');
  }

  try {
    const arrayBuffer = await imageFile.arrayBuffer();
    
    const command = new PutObjectCommand({
      Bucket: S3_CONFIG.bucketName,
      Key: `images/${imageName}`,
      Body: new Uint8Array(arrayBuffer),
      ContentType: imageFile.type || 'image/jpeg',
      ACL: 'public-read' // Make images publicly readable
    });

    await client.send(command);
    
    console.log(`✅ Uploaded image to S3: ${imageName}`);
    
    // Clear cache for this image so it reloads
    if (imageCache.has(imageName)) {
      const oldUrl = imageCache.get(imageName);
      if (oldUrl.startsWith('blob:')) {
        URL.revokeObjectURL(oldUrl);
      }
      imageCache.delete(imageName);
    }
    
    return {
      success: true,
      url: getS3ImageUrl(imageName),
      imageName: imageName
    };
  } catch (error) {
    console.error('Failed to upload image to S3:', error);
    throw new Error(`Upload failed: ${error.message}`);
  }
};

// Clean up cached blob URLs (call on app unmount)
export const cleanupImageCache = () => {
  imageCache.forEach((url, imageName) => {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
      console.log(`🧹 Cleaned up cached image: ${imageName}`);
    }
  });
  imageCache.clear();
};

export default {
  loadImageFromS3,
  getS3ImageUrl,
  preloadEssentialImages,
  uploadImageToS3,
  cleanupImageCache
};