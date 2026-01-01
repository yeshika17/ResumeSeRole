import React, { useState } from 'react';
import '../css/MatchDash.css';
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import { apiPost } from "./api";
const MatchDash = () => {
  const [resume, setResume] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [matchResult, setMatchResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const navigate = useNavigate();

  const handleResumeUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResume(file);
    }
  };

  const handleAnalyze = async () => {
    if (!resume || !jobDescription) {
      alert("Please upload a resume and enter a job description");
      return;
    }

    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append("resume", resume);             
      formData.append("jobDescription", jobDescription);
      if (jobTitle) {
        formData.append("jobTitle", jobTitle);
      }

      

const res = await apiPost("/api/analyze", formData);

      
      // Add jobTitle to the result for job searching
      const resultWithTitle = {
        ...res.data,
        jobTitle: jobTitle || "Software Developer" // Default if not provided
      };
      
      setMatchResult(resultWithTitle);
      
      // Store analysis in localStorage for FindJobs component
      localStorage.setItem('resumeAnalysis', JSON.stringify(resultWithTitle));
    } catch (err) {
      console.error(err);
      alert("Backend error while analyzing");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setResume(null);
    setJobDescription('');
    setJobTitle('');
    setMatchResult(null);
  };

  const handleFindJobs = (mode) => {
    // Store the search mode
    localStorage.setItem('searchMode', mode);
    // Navigate to FindJobs page
    navigate('/Findjob');
  };

  return (
    <div className="match-dashboard">
      <header className="dashboard-header">
        <h1>Upload Your Resume — Let Our AI Roast It (Nicely)</h1>
        <h2>Before You Apply to 200 Jobs — Maybe Fix The Resume You Copy-Pasted 200 Times</h2>
        <p>Upload Your Resume. We'll Try to Make It Look Like You Know What You're Doing.</p>
        
      </header>

      <div className="dashboard-content">
        <div className="input-section">
          <div className="upload-card">
            <h2>Upload Resume</h2>
            <div className="file-upload">
              <input
                type="file"
                id="resume-upload"
                accept=".pdf,.doc,.docx"
                onChange={handleResumeUpload}
                className="file-input"
              />
              <label htmlFor="resume-upload" className="file-label">
                {resume ? (
                  <div className="file-info">
                    <span className="file-icon">📄</span>
                    <span className="file-name">{resume.name}</span>
                  </div>
                ) : (
                  <div className="upload-prompt">
                    <span className="upload-icon">📤</span>
                    <span>Click to upload or drag and drop</span>
                    <span className="file-types">PDF, DOC, DOCX (Max 5MB)</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="job-description-card">
            <h2>Job Title (Optional)</h2>
            <input
              type="text"
              className="job-title-input"
              placeholder="e.g., Senior Software Engineer"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
            />
          </div>

          <div className="job-description-card">
            <h2>Job Description</h2>
            <textarea
              className="job-description-input"
              placeholder="Paste the job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={6}
            />
          </div>

          <div className="action-buttons">
            <button
              className="analyze-button"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <span className="spinner"></span>
                  Analyzing...
                </>
              ) : (
                'Analyze Match'
              )}
            </button>
            <button className="reset-button" onClick={handleReset}>
              Reset
            </button>
          </div>
        </div>

        {matchResult && (
          <div className="results-section">
            <div className="score-card">
              <h2>Overall Match Score</h2>
              <div className="score-circle">
                <svg className="score-svg" viewBox="0 0 200 200">
                  <circle
                    className="score-bg"
                    cx="100"
                    cy="100"
                    r="80"
                  />
                  <circle
                    className="score-progress"
                    cx="100"
                    cy="100"
                    r="80"
                    style={{
                      strokeDasharray: `${matchResult.overallScore * 5.03} 503`
                    }}
                  />
                </svg>
                <div className="score-text">
                  <span className="score-number">{matchResult.overallScore}</span>
                  <span className="score-label">/ 100</span>
                </div>
              </div>
              <p className="score-description">
                {matchResult.overallScore >= 80 ? 'Excellent Match!' :
                 matchResult.overallScore >= 60 ? 'Good Match' :
                 'Needs Improvement'}
              </p>
            </div>

            {/* Section Scores - Direct from AI */}
            {matchResult.sectionScores && (
              <div className="skills-breakdown">
                <h2>Section Scores</h2>
                <div className="skill-bars">
                  {Object.entries(matchResult.sectionScores).map(([section, score]) => (
                    <div key={section} className="skill-item">
                      <div className="skill-header">
                        <span className="skill-name">
                          {section === 'technicalSkills' ? 'Technical Skills' :
                           section === 'coreKnowledge' ? 'Core Knowledge' :
                           section === 'atsStructure' ? 'ATS Structure' :
                           section.charAt(0).toUpperCase() + section.slice(1)}
                        </span>
                        <span className="skill-score">{score}%</span>
                      </div>
                      <div className="skill-bar">
                        <div
                          className="skill-progress"
                          style={{ width: `${score}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills Breakdown - Normalized version (if exists) */}
            {matchResult.skillsBreakdown && Object.keys(matchResult.skillsBreakdown).length > 0 && (
              <div className="skills-breakdown">
                <h2>Skills Breakdown</h2>
                <div className="skill-bars">
                  {Object.entries(matchResult.skillsBreakdown).map(([skill, score]) => (
                    <div key={skill} className="skill-item">
                      <div className="skill-header">
                        <span className="skill-name">
                          {skill === 'atsStructure' ? 'ATS Structure' :
                           skill === 'coreKnowledge' ? 'Core Knowledge' :
                           skill.charAt(0).toUpperCase() + skill.slice(1)}
                        </span>
                        <span className="skill-score">{score}%</span>
                      </div>
                      <div className="skill-bar">
                        <div
                          className="skill-progress"
                          style={{ width: `${score}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Keyword Analysis - Shows matching and missing skills */}
            <div className="keywords-section">
              <h2>Keyword Analysis</h2>
              <div className="keywords-grid">
                {(matchResult.keywordMatches || []).map((item, index) => (
                  <div
                    key={index}
                    className={`keyword-tag ${item.found ? 'found' : 'missing'}`}
                  >
                    <span className="keyword-icon">
                      {item.found ? '✓' : '✗'}
                    </span>
                    <span>{item.keyword}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths and Gaps */}
            <div className="insights-grid">
              <div className="insight-card strengths">
                <h3>
                  <span className="insight-icon">💪</span>
                  Matching Skills
                </h3>
                <ul>
                  {(matchResult.strengths || []).length > 0 ? (
                    matchResult.strengths.map((strength, index) => (
                      <li key={index}>{strength}</li>
                    ))
                  ) : (
                    <li>No matching skills identified</li>
                  )}
                </ul>
              </div>

              <div className="insight-card gaps">
                <h3>
                  <span className="insight-icon">⚠️</span>
                  Missing Skills
                </h3>
                <ul>
                  {(matchResult.gaps || []).length > 0 ? (
                    matchResult.gaps.map((gap, index) => (
                      <li key={index}>{gap}</li>
                    ))
                  ) : (
                    <li>No missing skills identified</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Major Weaknesses Section */}
            {matchResult.majorWeaknesses && matchResult.majorWeaknesses.length > 0 && (
              <div className="weaknesses-card">
                <h2>
                  <span className="insight-icon">🔍</span>
                  Major Weaknesses
                </h2>
                <ul className="weaknesses-list">
                  {matchResult.majorWeaknesses.map((weakness, index) => (
                    <li key={index}>{weakness}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Section Scores - Visual representation */}
            {matchResult.sectionScores && (
              <div className="section-scores-card">
                <h2>
                  <span className="insight-icon">📈</span>
                  Section Scores Overview
                </h2>
                <div className="section-scores-grid">
                  {Object.entries(matchResult.sectionScores || {}).map(([section, score]) => (
                    <div key={section} className="section-score-item">
                      <div className="section-score-header">
                        <span className="section-name">
                          {section === 'technicalSkills' ? 'Technical Skills' :
                           section === 'coreKnowledge' ? 'Core Knowledge' :
                           section === 'atsStructure' ? 'ATS Structure' :
                           section.charAt(0).toUpperCase() + section.slice(1)}
                        </span>
                        <span className="section-score-value">{score}/100</span>
                      </div>
                      <div className="section-score-bar">
                        <div 
                          className="section-score-fill"
                          style={{ 
                            width: `${score}%`,
                            backgroundColor: score >= 70 ? '#48bb78' : score >= 50 ? '#f6e05e' : '#fc8181'
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Section Analysis */}
            {matchResult.detailedAnalysis && Object.keys(matchResult.detailedAnalysis).length > 0 && (
              <div className="detailed-analysis-card">
                <h2>
                  <span className="insight-icon">📊</span>
                  Detailed Section Analysis
                </h2>
                <div className="analysis-sections">
                  {Object.entries(matchResult.detailedAnalysis).map(([section, analysis]) => {
                    const sectionScore = matchResult.sectionScores?.[section] || null;
                    
                    return (
                      <div key={section} className="analysis-item">
                        <div className="analysis-header">
                          <h4>
                            {section === 'technicalSkills' ? 'Technical Skills' :
                             section === 'coreKnowledge' ? 'Core Knowledge' :
                             section === 'atsStructure' ? 'ATS Structure' :
                             section.charAt(0).toUpperCase() + section.slice(1)}
                          </h4>
                          {sectionScore !== null && (
                            <span className={`analysis-score ${sectionScore >= 70 ? 'high' : sectionScore >= 50 ? 'medium' : 'low'}`}>
                              {sectionScore}/100
                            </span>
                          )}
                        </div>
                        <p>{analysis}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Must-Do Improvements (Priority Actions) */}
            {matchResult.mustDoImprovements && matchResult.mustDoImprovements.length > 0 && (
              <div className="must-do-card">
                <h2>
                  <span className="insight-icon">🎯</span>
                  Must-Do Improvements
                </h2>
                <ul className="must-do-list">
                  {matchResult.mustDoImprovements.map((improvement, index) => (
                    <li key={index}>{improvement}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* General Recommendations */}
            {matchResult.recommendations && matchResult.recommendations.length > 0 && (
              <div className="recommendations-card">
                <h2>
                  <span className="insight-icon">💡</span>
                  Additional Recommendations
                </h2>
                <ul className="recommendations-list">
                  {matchResult.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Honest Verdict */}
            {matchResult.honestVerdict && (
              <div className="verdict-card">
                <h2>
                  <span className="insight-icon">⚖️</span>
                  Recruiter's Verdict
                </h2>
                <p className="verdict-text">{matchResult.honestVerdict}</p>
              </div>
            )}

            {/* NEW: Job Search Options */}
            <div className="job-search-section">
              <h2>
                <span className="insight-icon">🔍</span>
                Find Jobs That Match Your Profile
              </h2>
              <p className="job-search-description">
                Based on your resume analysis, discover opportunities that align with your skills
              </p>
              
              <div className="job-search-options">
                <div className="job-option-card">
                  <div className="job-option-icon">🌐</div>
                  <h3>All Matching Roles</h3>
                  <p>Explore diverse opportunities across different roles where your skills stand out</p>
                  <button 
                    className="job-option-button"
                    onClick={() => handleFindJobs('all')}
                  >
                    Find All Matching Jobs
                  </button>
                </div>

                <div className="job-option-card primary">
                  <div className="job-option-icon">🎯</div>
                  <h3>Jobs For Your Role</h3>
                  <p>Find opportunities specifically for: <strong>{matchResult.jobTitle}</strong></p>
                  <button 
                    className="job-option-button primary"
                    onClick={() => handleFindJobs('specific')}
                  >
                    Find Jobs In My Role
                  </button>
                </div>
              </div>
            </div>

            <div className="action-footer">
              <p>
                Hum Jobs Dhoondh Ke Laate Hain — Aap Bas Interview Mein Smart Banna Pretend Karo 😎
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchDash;