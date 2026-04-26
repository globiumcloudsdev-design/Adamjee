import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload file to Cloudinary
 * @param {Buffer|string} file - File buffer or base64 string
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result with url and publicId
 */
export async function uploadToCloudinary(file, options = {}) {
  try {
    const {
      folder = 'adamjee-campus12',
      resourceType = 'auto',
      format,
      transformation,
    } = options;

    const uploadOptions = {
      folder,
      resource_type: resourceType,
      ...(format && { format }),
      ...(transformation && { transformation }),
    };

    const result = await cloudinary.uploader.upload(file, uploadOptions);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      createdAt: result.created_at,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Public ID of the file
 * @param {string} resourceType - Type of resource (image, video, raw)
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteFromCloudinary(publicId, resourceType = 'image') {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    return result;
  } catch (error) {
    console.error('Cloudinary deletion error:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Upload multiple files to Cloudinary
 * @param {Array} files - Array of file buffers or base64 strings
 * @param {Object} options - Upload options
 * @returns {Promise<Array>} Array of upload results
 */
export async function uploadMultipleToCloudinary(files, options = {}) {
  try {
    const uploadPromises = files.map(file => uploadToCloudinary(file, options));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Cloudinary multiple upload error:', error);
    throw new Error(`Failed to upload files: ${error.message}`);
  }
}

/**
 * Upload profile photo
 * @param {Buffer|string} file - File buffer or base64 string
 * @param {string} userId - User ID for folder organization
 * @returns {Promise<Object>} Upload result
 */
export async function uploadProfilePhoto(file, userId) {
  return uploadToCloudinary(file, {
    folder: `adamjee-campus12/profiles/${userId}`,
    transformation: [
      { width: 500, height: 500, crop: 'fill', gravity: 'face' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  });
}

/**
 * Upload student document (B-Form, certificates, etc.)
 * @param {Buffer|string} file - File buffer or base64 string
 * @param {string} studentId - Student ID
 * @param {string} documentType - Type of document
 * @returns {Promise<Object>} Upload result
 */
export async function uploadStudentDocument(file, studentId, documentType) {
  return uploadToCloudinary(file, {
    folder: `adamjee-campus12/students/${studentId}/${documentType}`,
    resourceType: 'auto',
  });
}

/**
 * Upload teacher document (CV, Resume, certificates, etc.)
 * @param {Buffer|string} file - File buffer or base64 string
 * @param {string} teacherId - Teacher ID
 * @param {string} documentType - Type of document
 * @returns {Promise<Object>} Upload result
 */
export async function uploadTeacherDocument(file, teacherId, documentType) {
  return uploadToCloudinary(file, {
    folder: `adamjee-campus12/teachers/${teacherId}/${documentType}`,
    resourceType: 'auto',
  });
}

/**
 * Upload staff document
 * @param {Buffer|string} file - File buffer or base64 string
 * @param {string} staffId - Staff ID
 * @param {string} documentType - Type of document
 * @returns {Promise<Object>} Upload result
 */
export async function uploadStaffDocument(file, staffId, documentType) {
  return uploadToCloudinary(file, {
    folder: `adamjee-campus12/staff/${staffId}/${documentType}`,
    resourceType: 'auto',
  });
}

/**
 * Upload QR code
 * @param {string} dataUrl - QR code data URL
 * @param {string} userId - User ID
 * @param {string} type - User type (student, teacher, staff)
 * @returns {Promise<Object>} Upload result
 */
export async function uploadQR(dataUrl, userId, type) {
  return uploadToCloudinary(dataUrl, {
    folder: `adamjee-campus12/${type}s/${userId}/qr`,
    resourceType: 'image',
  });
}

/**
 * Upload syllabus PDF
 * @param {Buffer|string} file - File buffer or base64 string
 * @param {string} classId - Class ID for folder organization
 * @param {string} branchId - Branch ID for folder organization (optional)
 * @returns {Promise<Object>} Upload result
 */
export async function uploadSyllabusPdf(file, classId, branchId = null) {
  const folder = branchId 
    ? `adamjee-campus12/syllabus/${branchId}/${classId}`
    : `adamjee-campus12/syllabus/${classId}`;
  
  return uploadToCloudinary(file, {
    folder,
    resourceType: 'auto', // Supports PDF and other document types
  });
}

/**
 * Get cloudinary URL with transformations
 * @param {string} publicId - Public ID of the file
 * @param {Object} transformations - Transformation options
 * @returns {string} Transformed URL
 */
export function getCloudinaryUrl(publicId, transformations = {}) {
  return cloudinary.url(publicId, transformations);
}

/**
 * Generate signed upload URL for client-side uploads
 * @param {Object} options - Upload options
 * @returns {Object} Signed upload credentials
 */
export function generateSignedUploadUrl(options = {}) {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      ...options,
    },
    process.env.CLOUDINARY_API_SECRET
  );

  return {
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
  };
}

export default cloudinary;
