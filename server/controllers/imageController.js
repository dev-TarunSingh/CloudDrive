import Image from '../models/Image.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

export const upload = multer({ storage }).array('images', 10);

export const uploadImage = async (req, res) => {
  const { folder } = req.body;
  const images = req.files.map(file => ({
    name: file.originalname,
    url: `/uploads/${file.filename}`,
    folderId: folder,
    userId: req.user.id,
  }));

  await Image.insertMany(images);
  res.json({ success: true, images });
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
