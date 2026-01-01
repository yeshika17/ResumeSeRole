import axios from "axios";

// ---- Helper to ensure job links are absolute URLs ----
function normalizeLink(link) {
  if (!link) return "";

  // Add https:// if link starts with // or www
  if (link.startsWith("www.") || link.startsWith("//")) {
    return "https://" + link.replace(/^\/+/, "");
  }

  // If relative LinkedIn path → prepend base URL
  if (link.startsWith("/")) {
    return "https://www.linkedin.com" + link;
  }

  // Already absolute
  return link;
}

export default async function scrapeJobsList(keyword, location) {
  try {
    console.log("\n🔍 [Jobs API 14] Fetching jobs from last 24h...");

    const apiKey = process.env.RAPID_API_KEY;
    if (!apiKey) {
      console.log("   ⚠️ RapidAPI key missing");
      return [];
    }

    const url = "https://jobs-api14.p.rapidapi.com/v2/linkedin/search";

    const response = await axios.get(url, {
      params: {
        query: keyword,
        experienceLevels: "intern;entry;associate;midSenior;director",
        workplaceTypes: "remote;hybrid;onSite",
        employmentTypes: "contractor;fulltime;parttime;intern;temporary",
        datePosted: "day",
        location: location || "Worldwide",
      },
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "jobs-api14.p.rapidapi.com",
      },
      timeout: 15000,
    });

    const jobsArray = response.data?.data || response.data?.jobs || [];

    const jobs = jobsArray.map((j) => {
      const rawLink = j.url || j.applyUrl || "";

      return {
        title: j.title || "Position",
        company: j.company?.name || j.company || "Company",
        location: j.location || location,
        link: normalizeLink(rawLink),
        description: j.description?.slice(0, 200) || "",
        source: "Jobs API 14 (24h)",
        postedDate: j.postedDate ? new Date(j.postedDate) : new Date(),
      };
    });

    console.log(`   ✅ Jobs API 14: ${jobs.length} jobs (API filtered to 24h)`);
    return jobs;
  } catch (error) {
    console.error("   ❌ Jobs API 14 error:", error.response?.data || error.message);
    return [];
  }
}
