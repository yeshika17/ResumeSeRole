import express from 'express';
import { getJobs } from '../controllers/job.controller.js';
const router = express.Router();
router.get('/', getJobs);
export default router;
