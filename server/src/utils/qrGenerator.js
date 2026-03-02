const QRCode = require('qrcode');

/**
 * Generates a QR code as a base64 data URL from the given data.
 * @param {string | object} data
 * @returns {Promise<string>} base64 PNG data URL
 */
const generateQRCode = async (data) => {
  const content = typeof data === 'string' ? data : JSON.stringify(data);
  return QRCode.toDataURL(content, {
    width: 300,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
  });
};

/**
 * Generates a QR code as a raw PNG Buffer.
 * @param {string | object} data
 * @returns {Promise<Buffer>}
 */
const generateQRCodeBuffer = async (data) => {
  const content = typeof data === 'string' ? data : JSON.stringify(data);
  return QRCode.toBuffer(content, { width: 300, margin: 2 });
};

module.exports = { generateQRCode, generateQRCodeBuffer };
