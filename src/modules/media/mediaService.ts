import cloudinary from '../../configs/cloudinaryConfig';
import {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} from '../../configs/envConfig';

/**
 * Generate a secure Cloudinary upload signature and parameters for client-side uploads.
 * This is a generic signature generator not bound to any specific database model.
 */
export const getUniversalUploadSignature = async (query: { folder: string }) => {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const folder = query.folder.trim();

  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder,
    },
    CLOUDINARY_API_SECRET || '',
  );

  return {
    signature,
    timestamp,
    folder,
    cloudName: CLOUDINARY_CLOUD_NAME,
    apiKey: CLOUDINARY_API_KEY,
  };
};
