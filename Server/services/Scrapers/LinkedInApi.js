import axios from "axios";

export default async function scrapeLinkedInJobsAPI(
  keyword,
  location,
  limit = 20,
  offset = 0
) {
  try {
    console.log("\n🔍 [LinkedIn Jobs API] Fetching jobs (strict 24h)...");

    const apiKey = process.env.RAPID_API_KEY;
    if (!apiKey) {
      console.log("   ⚠️ RapidAPI key missing");
      return [];
    }

    const url = "https://linkedin-job-search-api.p.rapidapi.com/active-jb-24h";

    // Supports: "India"  OR  ["USA","UK"] → "USA" OR "UK"
    const resolvedLocation =
      Array.isArray(location)
        ? location.map(l => `"${l}"`).join(" OR ")
        : `"${location}"`;

    const res = await axios.get(url, {
      params: {
        limit,
        offset,
        title_filter: `"${keyword}"`,
        location_filter: resolvedLocation,
        description_type: "text"
      },
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": "linkedin-job-search-api.p.rapidapi.com"
      },
      timeout: 15000
    });

    const data = res.data?.jobs || res.data || [];

    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;

    const jobs = data
      .map(j => {
        const posted =
          j.posted_date ||
          j.postedAt ||
          j.date ||
          j.listed_at ||
          null;

        const postedDate = posted ? new Date(posted) : null;

        return {
          title: j.title || "Position",
          company: j.company || j.company_name || "Company",
          location: j.location || location,
          link: j.job_url || j.url || "",
          source: "LinkedIn API (24h)",
          description: j.description?.slice(0, 200) || "",
          postedDate
        };
      })
      .filter(j => {
        if (!j.postedDate || isNaN(j.postedDate.getTime())) return false;
        return j.postedDate.getTime() >= dayAgo;
      });

    console.log(`   ✅ LinkedIn Jobs API: ${jobs.length} jobs (strict 24h)`);
    return jobs;

  } catch (err) {
    console.error(
      "   ❌ LinkedIn Jobs API error:",
      err.response?.data || err.message
    );
    return [];
  }
}
