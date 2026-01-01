import axios from "axios";

export default async function scrapeJobicy(keyword, location) {
  try {
    console.log("\n🔍 [Jobicy] Fetching remote jobs...");

    const url = "https://jobicy.com/api/v2/remote-jobs";

    const res = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 15000
    });

    const jobsRaw = res.data?.jobs || [];

    const cutoff = Date.now() - 24 * 60 * 60 * 1000;

    const jobs = jobsRaw
      .filter(j =>
        (!keyword || j.jobTitle?.toLowerCase().includes(keyword.toLowerCase())) &&
        (!location || j.jobGeo?.toLowerCase().includes(location.toLowerCase()))
      )
      .filter(j => {
        const d = new Date(j.pubDate).getTime();
        return !isNaN(d) && d >= cutoff;
      })
      .slice(0, 20)
      .map(j => ({
        title: j.jobTitle,
        company: j.companyName,
        location: j.jobGeo || "Remote",
        link: j.url,
        source: "Jobicy",
        description: j.jobExcerpt?.slice(0, 200) || "",
        postedDate: new Date(j.pubDate),
        jobType: j.jobType,
        industry: j.jobIndustry
      }));

    console.log(`   ✅ Jobicy: ${jobs.length} jobs (24h)`);
    return jobs;

  } catch (err) {
    console.error("   ❌ Jobicy error:", err.message);
    return [];
  }
}
