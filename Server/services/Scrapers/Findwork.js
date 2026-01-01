import axios from 'axios';
export default async function scrapeFindWork(keyword) {
    try {
        console.log(`\n🔍 [FindWork] Fetching jobs...`);
        const apiKey = process.env.FINDWORK_KEY;
        
        if (!apiKey) {
            console.log('   ⚠️ API key not configured');
            return [];
        }
        
        const url = `https://findwork.dev/api/jobs/?search=${encodeURIComponent(keyword)}`;
        
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Token ${apiKey}`,
                'Accept': 'application/json'
            },
            timeout: 15000
        });
        
        if (!response.data || !response.data.results) {
            console.log('   ⚠️ No jobs returned');
            return [];
        }
        
        console.log(`   📊 Total jobs available: ${response.data.results.length}`);
        
        const now = Date.now();
        const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);
        const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
        
        let recentJobs = [];
        let olderJobs = [];
        
        response.data.results.forEach(j => {
            const dateField = j.created_at || j.date_posted || j.posted_at;
            const jobData = {
                title: j.role || 'Position',
                company: j.company_name || 'Company',
                location: j.location || 'Remote',
                link: j.url || '',
                source: 'FindWork',
                description: j.text ? j.text.slice(0, 200) : '',
                postedDate: dateField ? new Date(dateField) : new Date()
            };
            
            if (dateField) {
                try {
                    const jobDate = new Date(dateField).getTime();
                    if (jobDate >= twentyFourHoursAgo) {
                        recentJobs.push(jobData);
                    } else if (jobDate >= sevenDaysAgo) {
                        olderJobs.push(jobData);
                    }
                } catch (e) {
                    recentJobs.push(jobData);
                }
            } else {
                recentJobs.push(jobData);
            }
        });
        
        const finalJobs = [...recentJobs, ...olderJobs].slice(0, 20);
        console.log(`   ✅ FindWork: ${recentJobs.length} from 24h, ${olderJobs.length} from 7d (total: ${finalJobs.length})`);
        return finalJobs;
        
    } catch (err) {
        console.error(`   ❌ FindWork: ${err.message}`);
        return [];
    }
}