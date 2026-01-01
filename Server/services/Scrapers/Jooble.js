import axios from 'axios';
export default async function scrapeJooble(keyword, location) {
    try {
        console.log(`\n🔍 [Jooble] Fetching jobs...`);
        const apiKey = process.env.JOOBLE_KEY;
        
        if (!apiKey) {
            console.log('   ⚠️ API key not configured');
            return [];
        }
        
        const url = `https://jooble.org/api/${apiKey}`;
        
        const response = await axios.post(url, {
            keywords: keyword,
            location: location || 'India',
            page: 1
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000
        });
        
        if (!response.data || !response.data.jobs) {
            console.log('   ⚠️ No jobs returned');
            return [];
        }
        
        console.log(`   📊 Total jobs available: ${response.data.jobs.length}`);
        
        const jobs = response.data.jobs
            .slice(0, 20)
            .map(j => ({
                title: j.title || 'Position',
                company: j.company || 'Company',
                location: j.location || location,
                link: j.link || '',
                source: 'Jooble',
                description: j.snippet ? j.snippet.slice(0, 200) : '',
                postedDate: j.updated ? new Date(j.updated) : new Date()
            }));
        
        console.log(`   ✅ Jooble: ${jobs.length} jobs (date filtering not available)`);
        return jobs;
        
    } catch (err) {
        console.error(`   ❌ Jooble: ${err.message}`);
        return [];
    }
}