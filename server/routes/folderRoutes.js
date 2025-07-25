import express from 'express';
import auth from '../middlewares/authMiddleware.js';
import { createFolder, getContent, deleteFolder, getContentRecursive } from '../controllers/folderController.js';

const router = express.Router();

router.post('/', auth, createFolder);
router.delete('/:id', auth, deleteFolder);
router.get("/contents", auth, getContent);
router.get("/contents/recursive", auth, getContentRecursive);

export default router;
