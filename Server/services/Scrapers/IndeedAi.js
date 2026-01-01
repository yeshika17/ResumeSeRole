import axios from "axios";

export default async function scrapeIndeedFinland(keyword, location, offset = 0) {
  try {
    console.log("\n🔍 [Indeed Finland API] Fetching jobs (last 24h)...");

    const apiKey = process.env.RAPID_API_KEY;
    if (!apiKey) {
      console.log("   ⚠️ RapidAPI key missing");
      return [];
    }

    const url = "https://indeed-jobs-api-finland.p.rapidapi.com/indeed-fi/";

    const res = await axios.get(url, {
      params: {
        offset,
        keyword,
        location
      },
      headers: {
        "x-rapidapi-host": "indeed-jobs-api-finland.p.rapidapi.com",
        "x-rapidapi-key": apiKey
      },
      timeout: 15000
    });

    const results = res.data?.jobs || res.data || [];

    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;

    const jobs = results
      .filter(j => j.date || j.posted_date)
      .filter(j => {
        const d = new Date(j.date || j.posted_date).getTime();
        return !isNaN(d) && d >= dayAgo;
      })
      .map(j => ({
        title: j.title || "Position",
        company: j.company || "Company",
        location: j.location || location,
        link: j.url || j.job_url || "",
        source: "Indeed Finland API (24h)",
        description: j.description?.slice(0, 200) || "",
        postedDate: new Date(j.date || j.posted_date)
      }));

    console.log(`   ✅ Indeed Finland: ${jobs.length} jobs (24h filtered)`);
    return jobs;

  } catch (err) {
    console.error("   ❌ Indeed Finland API error:", err.response?.data || err.message);
    return [];
  }
}
