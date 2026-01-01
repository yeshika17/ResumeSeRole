import axios from 'axios';
import xml2js from 'xml2js';

/**
 * RemoteOK RSS Feed Scraper
 * RSS Feed: https://remoteok.com/remote-jobs.rss
 * FREE - No API key required!
 * Filters to last 24 hours only
 */

export default async function scrapeRemoteOKRSS(keyword) {
    try {
        console.log(`\n🔍 [RemoteOK RSS] Fetching jobs from last 24h...`);
        
        const feedUrl = 'https://remoteok.com/remote-jobs.rss';
        
        const response = await axios.get(feedUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 15000
        });
        
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(response.data);
        
        if (!result.rss || !result.rss.channel || !result.rss.channel[0].item) {
            console.log('   ⚠️ No jobs in RSS feed');
            return [];
        }
        
        const items = result.rss.channel[0].item;
        const now = Date.now();
        const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);
        const keywords = keyword.toLowerCase().split(' ').filter(k => k.length > 2);
        
        const jobs = items
            .filter(item => {
                try {
                    const title = item.title?.[0] || '';
                    const description = item.description?.[0] || '';
                    const pubDate = item.pubDate?.[0] || '';
                    
                    // Check keyword match
                    const searchText = `${title} ${description}`.toLowerCase();
                    const matches = keywords.some(kw => searchText.includes(kw));
                    if (!matches) return false;
                    
                    // Filter by date - last 24 hours only
                    if (pubDate) {
                        const jobDate = new Date(pubDate).getTime();
                        return jobDate >= twentyFourHoursAgo;
                    }
                    
                    return true;
                } catch (err) {
                    return false;
                }
            })
            .slice(0, 20)
            .map(item => {
                const fullTitle = item.title?.[0] || 'Position';
                const description = item.description?.[0] || '';
                const link = item.link?.[0] || '';
                const pubDate = item.pubDate?.[0] || '';
                
                // RemoteOK format is usually: "Position at Company"
                let title = fullTitle;
                let company = 'Company';
                
                if (fullTitle.includes(' at ')) {
                    const parts = fullTitle.split(' at ');
                    title = parts[0].trim();
                    company = parts[1].trim();
                } else if (fullTitle.includes(' - ')) {
                    const parts = fullTitle.split(' - ');
                    title = parts[0].trim();
                    company = parts[1]?.trim() || 'Company';
                }
                
                // Extract location if available
                let location = 'Remote (Worldwide)';
                const locationMatch = description.match(/location[:\s]+([^<\n,]+)/i);
                if (locationMatch) {
                    location = locationMatch[1].trim();
                }
                
                return {
                    title: title,
                    company: company,
                    location: location,
                    link: link,
                    source: 'RemoteOK (RSS)',
                    description: description.replace(/<[^>]*>/g, '').slice(0, 200),
                    postedDate: pubDate ? new Date(pubDate) : new Date()
                };
            });
        
        console.log(`   ✅ RemoteOK RSS: ${jobs.length} jobs (24h)`);
        return jobs;
        
    } catch (err) {
        console.error(`   ❌ RemoteOK RSS: ${err.message}`);
        return [];
    }
}