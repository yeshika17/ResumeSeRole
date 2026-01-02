import axios from 'axios';
import xml2js from 'xml2js';



export default async function scrapeWeWorkRemotelyRSS(keyword) {
    try {
        console.log(`\n🔍 [WeWorkRemotely RSS] Fetching jobs from last 24h...`);
        
        
        const rssFeeds = [
            'https://weworkremotely.com/categories/remote-programming-jobs.rss',
            'https://weworkremotely.com/categories/remote-devops-sysadmin-jobs.rss',
            'https://weworkremotely.com/categories/remote-design-jobs.rss',
            'https://weworkremotely.com/categories/remote-product-jobs.rss',
            'https://weworkremotely.com/remote-jobs.rss', 
        ];
        
        let allJobs = [];
        const now = Date.now();
        const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);
        
        for (const feedUrl of rssFeeds) {
            try {
                const response = await axios.get(feedUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    },
                    timeout: 10000
                });
                
                const parser = new xml2js.Parser();
                const result = await parser.parseStringPromise(response.data);
                
                if (!result.rss || !result.rss.channel || !result.rss.channel[0].item) {
                    continue;
                }
                
                const items = result.rss.channel[0].item;
                
                items.forEach(item => {
                    try {
                        const title = item.title?.[0] || '';
                        const description = item.description?.[0] || '';
                        const link = item.link?.[0] || '';
                        const pubDate = item.pubDate?.[0] || '';
                        
                        // Check if job matches keyword
                        const searchText = `${title} ${description}`.toLowerCase();
                        const keywords = keyword.toLowerCase().split(' ').filter(k => k.length > 2);
                        const matches = keywords.some(kw => searchText.includes(kw));
                        
                        if (!matches) return;
                        
                        // Filter by date - last 24 hours only
                        if (pubDate) {
                            const jobDate = new Date(pubDate).getTime();
                            if (jobDate < twentyFourHoursAgo) return;
                        }
                        
                        // Extract company name from title (usually format: "Company: Position")
                        const titleParts = title.split(':');
                        const company = titleParts.length > 1 ? titleParts[0].trim() : 'Company';
                        const position = titleParts.length > 1 ? titleParts.slice(1).join(':').trim() : title;
                        
                        allJobs.push({
                            title: position || title,
                            company: company,
                            location: 'Remote (Worldwide)',
                            link: link,
                            source: 'WeWorkRemotely (RSS)',
                            description: description.replace(/<[^>]*>/g, '').slice(0, 200),
                            postedDate: pubDate ? new Date(pubDate) : new Date()
                        });
                    } catch (err) {
                        // Skip invalid items
                    }
                });
                
            } catch (err) {
                console.log(`   ⚠️ Could not fetch ${feedUrl.split('/').pop()}`);
            }
        }
        
        // Remove duplicates
        const uniqueJobs = Array.from(
            new Map(allJobs.map(job => [`${job.title}-${job.company}`, job])).values()
        );
        
        console.log(`   ✅ WeWorkRemotely RSS: ${uniqueJobs.length} jobs (24h)`);
        return uniqueJobs;
        
    } catch (err) {
        console.error(`   ❌ WeWorkRemotely RSS: ${err.message}`);
        return [];
    }
}