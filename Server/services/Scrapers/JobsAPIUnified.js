 import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Jobs API via RapidAPI (Unified Multi-Platform)
 * API Documentation: https://rapidapi.com/letscrape-6bRBa3QguO5/api/jobs-api14
 * Multiple job boards in one API
 * Free tier: 100 requests/month
 */

export default async function scrapeJobsAPIUnified(keyword, location) {
    try {
        console.log(`\n🔍 [Jobs API Unified] Fetching jobs from last 24h...`);
        const apiKey = process.env.RAPID_API_KEY;
        
        if (!apiKey) {
            console.log('   ⚠️ RAPID_API_KEY not configured');
            return [];
        }
        
        const url = 'https://jobs-api14.p.rapidapi.com/v2/list';
        
        const response = await axios.get(url, {
            params: {
                query: keyword,
                location: location || 'India',
                autoTranslateLocation: 'false',
                remoteOnly: 'false',
                employmentTypes: 'fulltime;parttime;intern;contractor',
                datePosted: 'today', // Last 24 hours
                page: '1'
            },
            headers: {
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': 'jobs-api14.p.rapidapi.com'
            },
            timeout: 15000
        });
        
        if (!response.data || !response.data.jobs) {
            console.log('   ⚠️ No jobs returned');
            return [];
        }
        
        console.log(`   📊 Total jobs available: ${response.data.jobs.length}`);
        
        const jobs = response.data.jobs.map(j => ({
            title: j.title || 'Position',
            company: j.company?.name || j.company || 'Company',
            location: j.location || location,
            link: j.jobProviders?.[0]?.url || j.url || '',
            source: 'Jobs API (Unified)',
            description: j.description ? j.description.slice(0, 200) : '',
            postedDate: j.datePosted ? new Date(j.datePosted) : new Date(),
            salary: j.salary || null,
            jobType: j.employmentType || null
        }));
        
        console.log(`   ✅ Jobs API Unified: ${jobs.length} jobs (24h)`);
        return jobs;
        
    } catch (err) {
        console.error(`   ❌ Jobs API Unified: ${err.message}`);
        if (err.response?.status === 429) {
            console.log('   ⚠️ Rate limit exceeded');
        }
        return [];
    }
}
