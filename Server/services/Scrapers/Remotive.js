import axios from 'axios';
export default async function scrapeRemotive(keyword) {
    try {
        console.log(`\n🔍 [Remotive] Fetching remote jobs...`);
        const url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(keyword)}`;
        
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 15000
        });
        
        if (!response.data || !response.data.jobs) {
            console.log('   ⚠️ No jobs returned');
            return [];
        }
        
        console.log(`   📊 Total jobs available: ${response.data.jobs.length}`);
        
        const now = Date.now();
        const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);
        const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
        
        let recentJobs = [];
        let olderJobs = [];
        
        response.data.jobs.forEach(j => {
            const jobData = {
                title: j.title || 'Position',
                company: j.company_name || 'Company',
                location: j.candidate_required_location || 'Remote',
                link: j.url || '',
                source: 'Remotive',
                description: j.description ? j.description.slice(0, 200) : '',
                postedDate: j.publication_date ? new Date(j.publication_date) : new Date()
            };
            
            if (j.publication_date) {
                try {
                    const jobDate = new Date(j.publication_date).getTime();
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
        console.log(`   ✅ Remotive: ${recentJobs.length} from 24h, ${olderJobs.length} from 7d (total: ${finalJobs.length})`);
        return finalJobs;
        
    } catch (err) {
        console.error(`   ❌ Remotive: ${err.message}`);
        return [];
    }
}