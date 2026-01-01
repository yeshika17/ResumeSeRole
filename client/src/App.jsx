import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import JobSearch from "./pages/jobsearch.jsx";
import MatchDash from "./pages/matchdash.jsx";
import FindJob from "./pages/FindJob.jsx";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/jobs" element={<JobSearch />} />
        <Route path="/analyze" element={<MatchDash />} />
        <Route path="/Findjob" element={<FindJob />} />
      </Routes>
    </Router>
  );
}

export default App;
