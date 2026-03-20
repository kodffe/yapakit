import { Router, Request, Response, NextFunction } from 'express';
import { requireAnyAuth } from '../middleware/auth';
import { upload } from '../services/cloudinary';

const router = Router();

/**
 * @route   POST /api/upload
 * @desc    Upload a single image to Cloudinary
 * @access  Shared (Authenticated users OR Onboarding participants)
 */
router.post(
  '/',
  requireAnyAuth,
  upload.single('image'),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const file = (req as any).file;

      if (!file) {
        res.status(400).json({ success: false, message: 'No image file provided' });
        return;
      }

      // multer-storage-cloudinary stores the URL in file.path
      const imageUrl: string = file.path;

      res.json({
        success: true,
        data: { imageUrl },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
