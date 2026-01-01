import React, { useState, useEffect, useRef } from "react";
import "../css/FindJob.css";
import axios from "axios";
import { apiGet } from "./api";
const FindJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [resumeData, setResumeData] = useState(null);
  const [searchMode, setSearchMode] = useState(null); // 'all' or 'specific'

  const [filters, setFilters] = useState({
    location: "",
    experienceLevel: "all",
    jobType: "all",
  });

  const hasFetched = useRef(false);

  /* ---------------- LOAD RESUME + SAVED JOBS ---------------- */
  useEffect(() => {
    const storedAnalysis = localStorage.getItem("resumeAnalysis");
    const storedSavedJobs = localStorage.getItem("savedJobs");
    const storedSearchMode = localStorage.getItem("searchMode");

    if (storedAnalysis) {
      const parsed = JSON.parse(storedAnalysis);
      console.log("📋 Loaded Resume Data:", parsed);
      setResumeData(parsed);
    }
    if (storedSavedJobs) setSavedJobs(JSON.parse(storedSavedJobs));
    if (storedSearchMode) setSearchMode(storedSearchMode);
  }, []);

  /* ---------------- FETCH JOBS ONCE ---------------- */
  useEffect(() => {
    if (resumeData && searchMode && !hasFetched.current) {
      hasFetched.current = true;
      fetchRelevantJobs();
    }
  }, [resumeData, searchMode]);

  /* ---------------- FETCH JOBS ---------------- */
  const fetchRelevantJobs = async () => {
    setIsLoading(true);
    try {
      let keyword = "";
      
      if (searchMode === "all") {
        // For all roles: use broad skills from resume
        keyword = resumeData?.strengths?.slice(0, 5).join(" ") || "developer";
      } else {
        // For specific role: use job title + top skills
        const jobTitle = resumeData?.jobTitle || "";
        const topSkills = resumeData?.strengths?.slice(0, 3).join(" ") || "";
        keyword = `${jobTitle} ${topSkills}`.trim() || "developer";
      }

      const location = filters.location || "india";

      console.log("🔍 Searching with keyword:", keyword);

     const response = await apiGet("/api/jobs", {
  keyword,
  location,
});
      const rawJobs = response.data.jobs || response.data || [];
      console.log("📥 Fetched jobs:", rawJobs.length);

      const processed = rawJobs.map((job) => ({
        ...job,
        matchScore: calculateMatchScore(job, resumeData),
      }));

      processed.sort((a, b) => b.matchScore - a.matchScore);

      console.log("✅ Processed jobs with scores:", processed.slice(0, 3));

      setJobs(processed);
      localStorage.setItem("matchedJobs", JSON.stringify(processed));
    } catch (err) {
      console.error("Job fetch error:", err);
      alert("Failed to fetch jobs");
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------------- IMPROVED MATCH SCORE ---------------- */
  const calculateMatchScore = (job, resume) => {
    if (!resume) return 0;

    const jobText = `${job.title || ""} ${job.description || ""}`.toLowerCase();
    const jobTitle = (job.title || "").toLowerCase();
    const resumeTitle = (resume.jobTitle || "").toLowerCase();

    let score = 0;
    let matchDetails = {
      roleBonus: 0,
      skillMatches: 0,
      gapPenalty: 0,
      keywordMatches: 0
    };

    // 1. ROLE MATCHING (if in specific mode)
    if (searchMode === "specific" && resumeTitle) {
      const titleWords = resumeTitle.split(" ").filter(w => w.length > 2);
      titleWords.forEach(word => {
        if (jobTitle.includes(word)) {
          score += 10;
          matchDetails.roleBonus += 10;
        }
      });
    }

    // 2. STRENGTH MATCHING (Main scoring mechanism)
    const strengths = resume.strengths || [];
    strengths.forEach((skill) => {
      const skillLower = skill.toLowerCase();
      if (jobText.includes(skillLower)) {
        score += 12; // Increased from 8
        matchDetails.skillMatches++;
      }
    });

    // 3. KEYWORD MATCHING (if available from resume analysis)
    if (resume.keywordMatches && Array.isArray(resume.keywordMatches)) {
      resume.keywordMatches.forEach((item) => {
        if (item.found) {
          const keyword = item.keyword.toLowerCase();
          if (jobText.includes(keyword)) {
            score += 8;
            matchDetails.keywordMatches++;
          }
        }
      });
    }

    // 4. GAP PENALTY (reduce score for missing skills)
    const gaps = resume.gaps || [];
    gaps.forEach((gap) => {
      if (jobText.includes(gap.toLowerCase())) {
        score -= 3; // Reduced penalty from 5
        matchDetails.gapPenalty += 3;
      }
    });

    // 5. BASE SCORE (ensure minimum reasonable score)
    if (score === 0 && strengths.length > 0) {
      score = 15; // Minimum base score if we have resume data
    }

    // 6. NORMALIZE to 0-100 range
    // If we have many skills, scale appropriately
    const maxPossibleScore = (strengths.length * 12) + (searchMode === "specific" ? 30 : 0);
    if (maxPossibleScore > 0 && score > 0) {
      score = Math.round((score / maxPossibleScore) * 100);
    }

    // Ensure score is within reasonable bounds
    if (score < 10) score = 10;
    if (score > 100) score = 100;

    console.log(`🎯 Match score for "${job.title}":`, {
      finalScore: score,
      details: matchDetails,
      strengths: strengths.length,
      gaps: gaps.length
    });

    return score;
  };

  /* ---------------- SAVE / UNSAVE JOB ---------------- */
  const toggleSaveJob = (job) => {
    let updated;

    if (savedJobs.some((j) => j.link === job.link)) {
      updated = savedJobs.filter((j) => j.link !== job.link);
    } else {
      updated = [...savedJobs, job];
    }

    setSavedJobs(updated);
    localStorage.setItem("savedJobs", JSON.stringify(updated));
  };

  const isSaved = (job) => savedJobs.some((j) => j.link === job.link);

  /* ---------------- CHANGE SEARCH MODE ---------------- */
  const handleSearchModeChange = (mode) => {
    setSearchMode(mode);
    localStorage.setItem("searchMode", mode);
    hasFetched.current = false; // Reset to allow new fetch
    setJobs([]); // Clear current jobs
  };

  /* ---------------- FILTERED JOBS ---------------- */
  const filteredJobs = jobs.filter((job) => {
    const title = (job.title || "").toLowerCase();
    const desc = (job.description || "").toLowerCase();

    if (filters.experienceLevel === "entry") {
      if (!title.includes("junior") && !desc.includes("entry")) return false;
    }

    if (filters.experienceLevel === "senior") {
      if (!title.includes("senior") && !title.includes("lead")) return false;
    }

    if (filters.jobType === "remote") {
      if (!desc.includes("remote")) return false;
    }

    return true;
  });

  /* ---------------- DEBUG INFO ---------------- */
  useEffect(() => {
    if (resumeData) {
      console.log("📊 Resume Analysis Data:", {
        strengths: resumeData.strengths,
        gaps: resumeData.gaps,
        jobTitle: resumeData.jobTitle,
        overallScore: resumeData.overallScore
      });
    }
  }, [resumeData]);

  /* ---------------- UI ---------------- */
  // Show mode selection if not yet chosen
  if (!searchMode) {
    return (
      <div className="find-jobs-container">
        <div className="mode-selection">
          <h1>🎯 Find Your Perfect Job</h1>
          <p className="mode-subtitle">How would you like to search?</p>
          
          <div className="mode-cards">
            <div className="mode-card" onClick={() => handleSearchModeChange("all")}>
              <div className="mode-icon">🌐</div>
              <h3>All Matching Roles</h3>
              <p>Explore all jobs where your skills stand out, regardless of title</p>
              <button className="mode-button">Search All Roles</button>
            </div>

            <div className="mode-card" onClick={() => handleSearchModeChange("specific")}>
              <div className="mode-icon">🎯</div>
              <h3>My Specific Role</h3>
              <p>Find jobs matching your target role: <strong>{resumeData?.jobTitle || "your role"}</strong></p>
              <button className="mode-button primary">Search My Role</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="find-jobs-container">
      <div className="jobs-header">
        <div>
          <h1>🎯 {searchMode === "all" ? "All Matching Jobs" : "Jobs For Your Role"}</h1>
          <p className="search-mode-indicator">
            {searchMode === "all" 
              ? "Showing jobs across all roles that match your skills"
              : `Showing jobs for: ${resumeData?.jobTitle || "your role"}`
            }
          </p>
        </div>
        
        <button 
          className="change-mode-button"
          onClick={() => {
            setSearchMode(null);
            localStorage.removeItem("searchMode");
            setJobs([]);
            hasFetched.current = false;
          }}
        >
          Change Search Mode
        </button>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <div className="spinner-large"></div>
          <p>Finding best jobs for you...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="no-jobs-state">
          <p>No jobs found. Try changing your search mode or filters.</p>
        </div>
      ) : (
        <>
          <div className="stats-bar">
            <p>Found {filteredJobs.length} jobs matching your profile</p>
          </div>
          
          <div className="jobs-grid">
            {filteredJobs.map((job, index) => (
              <div key={index} className="job-card">
                <div className="job-header">
                  <h3>{job.title}</h3>
                  <span
                    className={`match-badge ${
                      job.matchScore >= 70
                        ? "high"
                        : job.matchScore >= 50
                        ? "medium"
                        : "low"
                    }`}
                  >
                    {job.matchScore}% Match
                  </span>
                </div>

                <p className="company">{job.company || "Company"}</p>
                <p className="location">{job.location || "Location not listed"}</p>

                <p className="description">
                  {job.description?.slice(0, 180)}...
                </p>

                <div className="job-actions">
                  <a
                    href={job.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="apply-button"
                  >
                    Apply
                  </a>

                  <button
                    className={`save-button ${isSaved(job) ? "saved" : ""}`}
                    onClick={() => toggleSaveJob(job)}
                  >
                    {isSaved(job) ? "★ Saved" : "☆ Save"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default FindJobs;