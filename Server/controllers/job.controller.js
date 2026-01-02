import { fetchAllJobsService } from '../services/job.services.js';
import Job from '../models/Job.js';
const CACHE_DURATION = 5 * 60 * 60 * 1000;

export async function getJobs(req, res) {
    const { keyword, location } = req.query;
    
    console.log('\n📥 API Request received:');
    console.log(` Endpoint: GET /api/jobs`);
    console.log(`Keyword: ${keyword || 'MISSING'}`);
    console.log(`Location: ${location || 'NOT PROVIDED'}`);
  
    if (!keyword) {
        console.log('❌ Validation failed: Missing job title\n');
        return res.status(400).json({ 
            error: 'Keyword is required',
            example: '/api/jobs?keyword=developer&location=india'
        });
    }
    const normalizedKeyword = keyword.trim().toLowerCase();
    const normalizedLocation = location ? location.trim().toLowerCase() : 'all';

    try {
       
        console.log('   🔍 Checking cache...');
        const cacheTime = new Date(Date.now() - CACHE_DURATION);
        const cachedJobs = await Job.find({
            keyword: normalizedKeyword,
            searchLocation: normalizedLocation,
            dateFetched: { $gte: cacheTime }
        }).sort({ dateFetched: -1 });

        if (cachedJobs.length > 0) {
            console.log(`✅ Cache HIT! Found ${cachedJobs.length} jobs from cache`);
            console.log(` 📅 Cache age: ${Math.round((Date.now() - cachedJobs[0].dateFetched) / 60000)} minutes old\n`);
            
            return res.json({
                success: true,
                totalJobs: cachedJobs.length,
                keyword,
                location: location || 'All locations',
                cached: true,
                cacheAge: Math.round((Date.now() - cachedJobs[0].dateFetched) / 60000) + ' minutes',
                jobs: cachedJobs.map(j => ({
                    title: j.title,
                    company: j.company,
                    location: j.location,
                    link: j.link,
                    source: j.source,
                    salary: j.salary,
                    tags: j.tags
                }))
            });
        }

        console.log('❌ Cache MISS - Need to scrape fresh data');
        
        console.log('⏳ Fetching jobs from sources...\n');
        const jobs = await fetchAllJobsService(keyword, location || 'all');
        
        if (jobs.length === 0) {
            console.log('⚠️ No jobs found, returning empty array\n');
            return res.json({ 
                message: 'No jobs found. Try different keywords or locations.',
                jobs: [],
                totalJobs: 0,
                cached: false
            });
        }

        console.log(` 💾 Saving ${jobs.length} jobs to cache...`);
        const jobsWithCache = jobs.map(job => ({
            ...job,
            keyword: normalizedKeyword,
            searchLocation: normalizedLocation,
            dateFetched: new Date()
        }));

        try {
            await Job.deleteMany({
                keyword: normalizedKeyword,
                searchLocation: normalizedLocation
            });
            
            await Job.insertMany(jobsWithCache, { ordered: false });
            console.log(`✅ Cache updated successfully\n`);
        } catch (err) {
            console.error(` ⚠️ Cache save failed: ${err.message}`);
        }
        
        console.log(` ✅ Returning ${jobs.length} fresh jobs to client\n`);
        return res.json({
            success: true,
            totalJobs: jobs.length,
            keyword,
            location: location || 'All locations',
            cached: false,
            jobs: jobs.map(j => ({
                title: j.title,
                company: j.company,
                location: j.location,
                link: j.link,
                source: j.source,
                salary: j.salary,
                tags: j.tags
            }))
        });
        
    } catch (err) {
        console.error('❌ Error in getJobs controller:', err);
        console.error(' Stack:', err.stack);
        return res.status(500).json({ 
            error: 'Failed to fetch jobs',
            message: err.message,
            details: 'Check server logs for more information'
        });
    }
}