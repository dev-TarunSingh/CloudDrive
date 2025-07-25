import Image from '../models/Image.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join('uploads');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

export const upload = multer({ storage }).array('images', 10);

export const uploadImage = async (req, res) => {
  try {
    const { folder } = req.body;

    // ✅ Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded.",
      });
    }

    // ✅ Proceed only if files exist
    const images = req.files.map((file) => ({
      name: file.originalname,
      url: `/uploads/${file.filename}`,
      folderId: folder,
      userId: req.user.id,
    }));

    // ✅ Insert into DB only after confirming upload
    const inserted = await Image.insertMany(images);
    return res.json({ success: true, images: inserted });

  } catch (err) {
    console.error("Upload Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error during upload.",
    });
  }
};



export const searchImages = async (req, res) => {
  const { query } = req.query;
  const images = await Image.find({
    userId: req.user.id,
    name: { $regex: query, $options: 'i' },
  });
  res.json(images);
};

export const deleteImage = async (req, res) => {
  const { id } = req.params;
  const image = await Image.findOne({ _id: id, userId: req.user.id });
  if (!image) return res.status(404).json({ message: 'Image not found' });
  fs.unlinkSync(`.${image.url}`);
  await Image.deleteOne({ _id: id });
  res.json({ message: 'Image deleted' });
};
