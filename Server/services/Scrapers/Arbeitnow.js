import axios from 'axios';

export default async function scrapeArbeitnow(keyword, location) {
    try {
        console.log(`\n🔍 [Arbeitnow] Fetching jobs...`);
        
        const url = 'https://www.arbeitnow.com/api/job-board-api';
        
        const response = await axios.get(url, {
            params: {
                search: keyword,
                location: location || '',
                page: 1
            },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 15000
        });
        
        if (!response.data || !response.data.data) {
            console.log('   ⚠️ No jobs returned');
            return [];
        }
        
        console.log(`   📊 Total jobs available: ${response.data.data.length}`);
        
        // Filter to last 24 hours
        const now = Date.now();
        const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);
        
        const jobs = response.data.data
            .filter(j => {
                if (j.created_at) {
                    try {
                        const jobDate = new Date(j.created_at).getTime();
                        return jobDate >= twentyFourHoursAgo;
                    } catch (e) {
                        return true;
                    }
                }
                return true; // Include if no date
            })
            .slice(0, 20)
            .map(j => ({
                title: j.title || 'Position',
                company: j.company_name || 'Company',
                location: j.location || location,
                link: j.url || '',
                source: 'Arbeitnow',
                description: j.description ? j.description.slice(0, 200) : '',
                postedDate: j.created_at ? new Date(j.created_at) : new Date(),
                tags: j.tags || [],
                remote: j.remote || false
            }));
        
        console.log(`   ✅ Arbeitnow: ${jobs.length} jobs (filtered to 24h)`);
        return jobs;
        
    } catch (err) {
        console.error(`   ❌ Arbeitnow: ${err.message}`);
        return [];
    }
}