import axios from "axios";

export default async function scrapeActiveJobsDB(keyword, location) {
  try {
    console.log("\n🔍 [ActiveJobsDB] Fetching jobs from last 7d...");

    const apiKey = process.env.RAPID_API_KEY;
    if (!apiKey) {
      console.log("   ⚠️ RapidAPI key not configured");
      return [];
    }

    const response = await fetch("https://google-api31.p.rapidapi.com/maps/textsearch", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "x-rapidapi-host": "google-api31.p.rapidapi.com",
        "x-rapidapi-key": process.env.RAPIDAPI_KEY_GOOGLE_MAPS
    },
    body: JSON.stringify(requestBody)
});


    if (!Array.isArray(response.data)) {
      console.log("   ⚠️ Unexpected response format", response.data);
      return [];
    }

    const now = Date.now();
    const cutoff = now - 24 * 60 * 60 * 1000;

    const jobs = response.data.map(j => {
      const posted = j.posted_date ? new Date(j.posted_date) : new Date();
      return {
        title: j.title || "Position",
        company: j.company || j.company_name || "Company",
        location: j.location || location,
        link: j.url || j.apply_url || "",
        source: "ActiveJobsDB",
        description: (j.description || "").slice(0, 200),
        postedDate: posted,
        isRecent: posted.getTime() >= cutoff,
      };
    });

    const recent = jobs.filter(j => j.isRecent);
    const older  = jobs.filter(j => !j.isRecent);

    const finalJobs = [...recent, ...older].slice(0, 30);

    console.log(
      `   ✅ ActiveJobsDB: ${recent.length} from 24h, ${older.length} older (total ${finalJobs.length})`
    );

    return finalJobs;
  } catch (err) {
    console.error(
      "   ❌ ActiveJobsDB Error:",
      err.response?.data || err.message,
      err.response?.status
    );
    return [];
  }
}
