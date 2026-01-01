import { useNavigate } from "react-router-dom";
import '../css/Home.css';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="home-content">
        <h1 className="home-title">Welcome!</h1>
        <h2 className="home-subtitle">One Click: Better Resume. More Jobs. Less Crying.</h2>
        
        <div className="button-group">
          <button onClick={() => navigate("/jobs")} className="btn btn-primary">
            Find a Job
          </button>
          <button onClick={() => navigate("/analyze")} className="btn btn-secondary">
            Analyze Resume
          </button>
        </div>

        <div className="home-footer">
          <p className="footer-tagline"></p>
          <p className="footer-description">
            Tired of Rejections? Let's Make Sure Your Resume Isn't The Main Character of The Problem.
          </p>
        </div> 
      </div>
    </div>
  );
}