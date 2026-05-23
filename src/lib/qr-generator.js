import QRCode from 'qrcode';
import bwipjs from 'bwip-js';

/**
 * Generate QR code as Data URL
 * @param {string} data - Data to encode in QR code
 * @param {Object} options - QR code options
 * @returns {Promise<string>} QR code as base64 data URL
 */
export async function generateQRCode(data, options = {}) {
  try {
    const defaultOptions = {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 7,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      ...options,
    };

    const qrDataURL = await QRCode.toDataURL(data, defaultOptions);
    return qrDataURL;
  } catch (error) {
    console.error('QR Code generation error:', error);
    throw new Error(`Failed to generate QR code: ${error.message}`);
  }
}

/**
 * Generate QR code for teacher with encoded data
 * @param {Object} teacher - Teacher object
 * @returns {Promise<string>} QR code data URL
 */
export async function generateTeacherQR(teacher) {
  const qrData = JSON.stringify({
    id: teacher._id || teacher.id,
    registrationNumber: teacher.registration_no,
  });

  return generateQRCode(qrData, {
    width: 400,
    margin: 2,
  });
}

/**
 * Generate QR code for student with encoded data
 * @param {Object} student - Student object
 * @returns {Promise<string>} QR code data URL
 */
export async function generateStudentQR(student) {
  const qrData = JSON.stringify({
    id: student.id,
  });

  return generateQRCode(qrData, {
    width: 400,
    margin: 2,
  });
}

/**
 * Generate Barcode as Data URL
 * @param {string} data - Data to encode in Barcode
 * @param {Object} options - Barcode options
 * @returns {Promise<string>} Barcode as base64 data URL
 */
export async function generateBarcodeURL(data, options = {}) {
  try {
    const buffer = await bwipjs.toBuffer({
      bcid: 'code128',       // Barcode type
      text: data,            // Text to encode
      scale: 3,              // 3x scaling factor
      height: 10,            // Bar height, in millimeters
      includetext: true,     // Show human-readable text
      textxalign: 'center',  // Always good to set this
      ...options
    });
    
    // Convert buffer to data URL
    return `data:image/png;base64,${buffer.toString('base64')}`;
  } catch (error) {
    console.error('Barcode generation error:', error);
    throw new Error(`Failed to generate Barcode: ${error.message}`);
  }
}

/**
 * Generate Barcode for student
 * @param {Object} student - Student object
 * @returns {Promise<string>} Barcode data URL
 */
export async function generateStudentBarcode(student) {
  // Use registration_no because UUID (36 chars) is too long and makes the barcode unscannable
  const dataToEncode = student.registration_no || student.details?.academic_info?.roll_no || student.id;
  return generateBarcodeURL(dataToEncode);
}

/**
 * Generate QR code for staff with encoded data
 * @param {Object} staff - Staff object
 * @returns {Promise<string>} QR code data URL
 */
export async function generateStaffQR(staff) {
  const qrData = JSON.stringify({
    id: staff.id,
    registrationNumber: staff.registration_no,
  });

  return generateQRCode(qrData, {
    width: 400,
    margin: 2,
  });
}

/**
 * Decode QR code data
 * @param {string} qrData - QR code data string
 * @returns {Object} Decoded QR data object
 */
export function decodeQRData(qrData) {
  try {
    return JSON.parse(qrData);
  } catch (error) {
    console.error('QR decode error:', error);
    return null;
  }
}

export default {
  generateQRCode,
  generateTeacherQR,
  generateStudentQR,
  generateStudentBarcode,
  generateStaffQR,
  decodeQRData,
};
