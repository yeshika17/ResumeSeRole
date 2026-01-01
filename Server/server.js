import dotenv from "dotenv";
dotenv.config();
import express from "express";
import mongoose from 'mongoose';
import cors from "cors";
import analyzeRoute from "./routes/analyze.routes.js";
import jobRoute from "./routes/job.routes.js";

const app = express();
app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
  res.send("Server is running ✅");
});

app.use("/api/jobs", jobRoute);
app.use("/api/analyze", analyzeRoute);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
