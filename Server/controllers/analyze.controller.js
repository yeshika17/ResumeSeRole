import { extractResumeText } from "../utils/resumeParser.js";
import { analyzeResumeWithJob } from "../services/ai.services.js";
import fs from "fs";

export const analyzeResumeJob = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No resume file uploaded" });
    }

    if (!req.body.jobDescription) {
      return res.status(400).json({ error: "Job description is required" });
    }


    const resumeText = await extractResumeText(req.file.path);


    const jobDescription = req.body.jobDescription;

    const result = await analyzeResumeWithJob(resumeText, jobDescription);

    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.json(result);
  } catch (err) {
    console.error("Error analyzing resume:", err);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: "Analysis failed",
      details: err.message 
    });
  }
};