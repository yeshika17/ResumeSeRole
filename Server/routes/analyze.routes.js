import express from "express";
import multer from "multer";
import { analyzeResumeJob } from "../controllers/analyze.controller.js";

const router = express.Router();

const upload = multer({ dest: "uploads/" });

router.post("/", upload.single("resume"), analyzeResumeJob);

export default router;
