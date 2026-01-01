import axios from "axios";
import xml2js from "xml2js";

export default async function scrapeRemotiveRSS(keyword) {
  try {
    console.log("\n🔍 [Remotive RSS] Fetching jobs from last 24h...");

    const url = "https://remotive.com/remote-jobs.rss";

    const res = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 15000
    });

    const parsed = await new xml2js.Parser().parseStringPromise(res.data);
    const items = parsed?.rss?.channel?.[0]?.item || [];

    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const keywords = keyword?.toLowerCase().split(" ") || [];

    const jobs = items
      .map(item => {
        const title = item.title?.[0] || "";
        const desc = item.description?.[0] || "";
        const link = item.link?.[0] || "";
        const pub = item.pubDate?.[0] || "";

        return {
          title,
          company: "Remotive",
          location: "Remote",
          link,
          source: "Remotive (RSS)",
          description: desc.replace(/<[^>]+>/g, "").slice(0, 200),
          postedDate: pub ? new Date(pub) : null
        };
      })
      .filter(j => j.postedDate && j.postedDate.getTime() >= cutoff)
      .filter(j =>
        !keyword || j.title.toLowerCase().includes(keyword.toLowerCase())
      )
      .slice(0, 20);

    console.log(`   ✅ Remotive RSS: ${jobs.length} jobs (24h)`);
    return jobs;

  } catch (err) {
    console.error("   ❌ Remotive RSS error:", err.message);
    return [];
  }
}
