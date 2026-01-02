import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();



export default async function scrapeSerpApiGoogleJobs(keyword, location) {
    try {
        console.log(`\n🔍 [SerpApi Google Jobs] Fetching jobs from last 24h...`);
        const apiKey = process.env.SERPAPI_API_KEY;
        
        if (!apiKey) {
            console.log('   ⚠️ SERPAPI_API_KEY not configured');
            return [];
        }
        
        const url = 'https://serpapi.com/search';
        
        const response = await axios.get(url, {
            params: {
                engine: 'google_jobs',
                q: keyword,
                location: location || 'India',
                api_key: apiKey,
                chips: 'date_posted:today', 
                lrad: '100' 
            },
            timeout: 15000
        });
        
        if (!response.data || !response.data.jobs_results) {
            console.log('   ⚠️ No jobs returned');
            return [];
        }
        
        console.log(`   📊 Total jobs available: ${response.data.jobs_results.length}`);
        
        const jobs = response.data.jobs_results.map(j => ({
            title: j.title || 'Position',
            company: j.company_name || 'Company',
            location: j.location || location,
            link: j.share_url || j.apply_link || '',
            source: 'Google Jobs (SerpApi)',
            description: j.description ? j.description.slice(0, 200) : '',
            postedDate: j.detected_extensions?.posted_at 
                ? new Date(j.detected_extensions.posted_at) 
                : new Date(),
            salary: j.detected_extensions?.salary || null,
            jobType: j.detected_extensions?.schedule_type || null,
            thumbnail: j.thumbnail || null
        }));
        
        console.log(`   ✅ SerpApi Google Jobs: ${jobs.length} jobs (24h)`);
        return jobs;
        
    } catch (err) {
        console.error(`   ❌ SerpApi Google Jobs: ${err.message}`);
        if (err.response?.status === 401) {
            console.log('   ⚠️ Invalid API key');
        } else if (err.response?.status === 429) {
            console.log('   ⚠️ Rate limit exceeded');
        }
        return [];
    }
}