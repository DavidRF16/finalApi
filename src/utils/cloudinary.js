const cloudinary = require('cloudinary').v2;
const fs = require('fs').promises;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadImage = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, { folder: 'lowissshop' });
    await fs.unlink(filePath);
    return result.secure_url;
  } catch (err) {
    console.error(err);
    throw new Error('Error subiendo imagen');
  }
};

module.exports = { uploadImage };