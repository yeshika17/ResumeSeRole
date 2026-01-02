import axios from "axios";

export default async function scrapeActiveJobsDB(keyword, location) {
  const source = "ActiveJobsDB";

  try {
    console.log(`\n🔍 [${source}] Fetching jobs from last 7d...`);

    const apiKey = process.env.RAPID_API_KEY;
    if (!apiKey) {
      console.log(`   ⚠️ ${source}: RapidAPI key not configured`);
      return [];
    }

    const response = await axios.get(
      "https://active-jobs-db.p.rapidapi.com/active-ats-7d",
      {
        params: {
          limit: 30,
          offset: 0,
          title_filter: keyword || "",
          location_filter: location || "India",
          description_type: "text",
        },
        headers: {
          "X-RapidAPI-Key": apiKey,
          "X-RapidAPI-Host": "active-jobs-db.p.rapidapi.com",
        },
        timeout: 15000,
      }
    );

    const data = response.data;

    if (!Array.isArray(data)) {
      console.log(`   ⚠️ ${source}: Unexpected response format`, data);
      return [];
    }

    const cutoff = Date.now() - 24 * 60 * 60 * 1000;

    const jobs = data.map(j => {
      const posted =
        j.posted_date ? new Date(j.posted_date) : new Date();

      return {
        title: j.title || "Position",
        company: j.company || j.company_name || "Company",
        location: j.location || location || "India",
        link: j.url || j.apply_url || "",
        source,
        description: (j.description || "").slice(0, 200),
        postedDate: posted.toISOString(),
        isRecent: posted.getTime() >= cutoff,
      };
    });

    const recent = jobs.filter(j => j.isRecent);
    const older  = jobs.filter(j => !j.isRecent);

    const finalJobs = [...recent, ...older].slice(0, 30);

    console.log(
      `   ✅ ${source}: ${recent.length} in last 24h, ${older.length} older (total ${finalJobs.length})`
    );

    return finalJobs;
  } catch (err) {
    console.error(
      `   ❌ ${source} Error:`,
      err.response?.data || err.message,
      err.response?.status
    );
    return [];
  }
}
