import QRCode from 'qrcode';

export const generateQrCode = async (url) => {
  try {
    const qrImage = await QRCode.toDataURL(url);
    return qrImage;
  } catch (err) {
    console.error('Error generating QR Code', err);
    throw new Error('Failed to generate QR Code');
  }
};
