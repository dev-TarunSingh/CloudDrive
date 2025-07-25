import express from 'express';
import auth from '../middlewares/authMiddleware.js';
import {
  upload,
  uploadImage,
  searchImages,
  deleteImage
} from '../controllers/imageController.js';

const router = express.Router();

router.post('/upload', auth, upload, uploadImage);
router.delete('/:_id', auth, deleteImage);
router.get('/search', auth, searchImages);

export default router;
