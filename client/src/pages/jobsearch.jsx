import React, { useState } from 'react';
import '../css/JobSearch.css';
import { apiFetch } from "./api";
const JobSearch = () => {
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [expandedSources, setExpandedSources] = useState({});

const handleSearch = async (e) => {
  e.preventDefault();

  if (!keyword || !location) {
    setError("Please enter both keyword and location");
    return;
  }

  setIsLoading(true);
  setError(null);
  setHasSearched(true);
  setExpandedSources({});

  try {
    const response = await apiFetch(
      `/api/jobs?keyword=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log("Jobs API Response =>", data);

    if (data.success && Array.isArray(data.jobs)) {
      setJobs(data.jobs);
    } else {
      setError("No jobs found. Try different keywords.");
      setJobs([]);
    }
  } catch (err) {
    console.error(err);
    setError("Failed to fetch jobs. Please check your server or connection.");
    setJobs([]);
  } finally {
    setIsLoading(false);
  }
};


  const handleReset = () => {
    setKeyword('');
    setLocation('');
    setJobs([]);
    setError(null);
    setHasSearched(false);
    setExpandedSources({});
  };

  const toggleSource = (source) => {
    setExpandedSources(prev => ({
      ...prev,
      [source]: !prev[source]
    }));
  };

  const groupJobsBySource = () => {
    const grouped = {};
    jobs.forEach(job => {
      if (!grouped[job.source]) {
        grouped[job.source] = [];
      }
      grouped[job.source].push(job);
    });
    return grouped;
  };

  const jobsBySource = groupJobsBySource();

  return (
    <div className="job-search-container">
      {/* Animated Background */}
      <div className="background-animation">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      {/* Header */}
      <header className="search-header">
        <div className="header-content">
          <h1 className="main-title">
            <span className="title-icon">🔍</span>
            Job Aggregator
          </h1>
          <p className="subtitle">Tired of Applying Everywhere? Cool. Now Apply Everywhere… From One Place.</p>
        </div>
      </header>

      {/* Search Section */}
      <div className="search-section">
        <form onSubmit={handleSearch} className="search-form">
          <div className="input-group">
            <div className="input-wrapper">
              <label htmlFor="keyword">What</label>
              <input
                type="text"
                id="keyword"
                placeholder="Job title, keywords, or company"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="search-input"
              />
              <span className="input-icon">💼</span>
            </div>

            <div className="input-wrapper">
              <label htmlFor="location">Where</label>
              <input
                type="text"
                id="location"
                placeholder="City or country"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="search-input"
              />
              <span className="input-icon">📍</span>
            </div>
          </div>

          <div className="button-group">
            <button type="submit" className="search-button" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Searching...
                </>
              ) : (
                <>
                  <span className="button-icon">🚀</span>
                  Find Jobs
                </>
              )}
            </button>
            <button type="button" onClick={handleReset} className="reset-button">
              <span className="button-icon">🔄</span>
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Results Section */}
      {hasSearched && !isLoading && jobs.length > 0 && (
        <>
          {/* Stats Bar */}
          <div className="stats-bar">
            <div className="stat-item">
              <span className="stat-number">{jobs.length}</span>
              <span className="stat-label">Total Jobs</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{Object.keys(jobsBySource).length}</span>
              <span className="stat-label">Sources</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{new Set(jobs.map(j => j.company)).size}</span>
              <span className="stat-label">Companies</span>
            </div>
          </div>

          {/* Jobs Container - Collapsible Sources */}
          <div className="jobs-container">
            {Object.entries(jobsBySource).map(([source, sourceJobs]) => (
              <div key={source} className="source-section">
                <div 
                  className="source-header"
                  onClick={() => toggleSource(source)}
                >
                  <div className="source-header-left">
                    <h2 className="source-title">
                      <span className="source-icon">
                        {source === 'RemoteOK' && '🌍'}
                        {source === 'LinkedIn' && '💼'}
                        {source === 'Indeed' && '🔍'}
                        {source === 'Internshala' && '🎓'}
                        {source === 'Naukri' && '🇮🇳'}
                        {source === 'Monster' && '👹'}
                      </span>
                      {source}
                    </h2>
                    <span className="job-count">{sourceJobs.length} jobs</span>
                  </div>
                  <span className={`expand-icon ${expandedSources[source] ? 'expanded' : ''}`}>
                    ▼
                  </span>
                </div>

                {expandedSources[source] && (
                  <div className="jobs-grid">
                    {sourceJobs.map((job, index) => (
                      <div key={index} className="job-card">
                        <div className="job-header">
                          <h3 className="job-title">{job.title}</h3>
                          <span className="job-source-badge">{job.source}</span>
                        </div>

                        <div className="job-company">
                          <span className="company-icon">🏢</span>
                          {job.company}
                        </div>

                        <div className="job-location">
                          <span className="location-icon">📍</span>
                          {job.location}
                        </div>

                        {job.tags && (
                          <div className="job-tags">
                            {job.tags.split(',').slice(0, 5).map((tag, i) => (
                              <span key={i} className="tag">{tag.trim()}</span>
                            ))}
                          </div>
                        )}

                        {job.salary && (
                          <div className="job-salary">
                            <span className="salary-icon">💰</span>
                            {job.salary}
                          </div>
                        )}

                        <a
                          href={job.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="apply-button"
                        >
                          <span>View Job</span>
                          <span className="arrow">→</span>
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Empty State */}
      {hasSearched && !isLoading && jobs.length === 0 && !error && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No jobs found</h3>
          <p>Try different keywords or locations</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p className="loading-text">Searching across multiple job boards...</p>
          <div className="loading-sources">
            <span className="loading-source">RemoteOK</span>
            <span className="loading-source">LinkedIn</span>
            <span className="loading-source">Indeed</span>
            <span className="loading-source">Internshala</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobSearch;