import axios from 'axios';
export default async function scrapeRemoteOK(keyword) {
    try {
        console.log(`\n🔍 [RemoteOK] Fetching remote jobs...`);
        const url = `https://remoteok.com/api`;
        
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json'
            },
            timeout: 15000
        });
        
        if (!response.data || !Array.isArray(response.data)) {
            console.log('⚠️ Invalid response');
            return [];
        }
        
        console.log(`   📊 Total jobs available: ${response.data.length - 1}`);
        
        const now = Date.now();
        const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);
        const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
        
        const keywords = keyword.toLowerCase().split(' ').filter(k => k.length > 2);
        
        let recentJobs = [];
        let olderJobs = [];
        
        response.data
            .slice(1) // Skip metadata
            .forEach(job => {
                if (!job || !job.position) return;
                
                const searchText = [
                    job.position || '',
                    job.company || '',
                    Array.isArray(job.tags) ? job.tags.join(' ') : '',
                ].join(' ').toLowerCase();
                
                const matches = keywords.some(kw => searchText.includes(kw));
                if (!matches) return;
                
                const jobData = {
                    title: job.position || 'Remote Position',
                    company: job.company || 'Company',
                    location: 'Remote (Worldwide)',
                    link: job.url || `https://remoteok.com/remote-jobs/${job.id}`,
                    source: 'RemoteOK',
                    description: job.description ? job.description.slice(0, 200) : '',
                    postedDate: job.epoch ? new Date(job.epoch * 1000) : new Date()
                };
                
                if (job.epoch) {
                    const jobDate = job.epoch * 1000;
                    if (jobDate >= twentyFourHoursAgo) {
                        recentJobs.push(jobData);
                    } else if (jobDate >= sevenDaysAgo) {
                        olderJobs.push(jobData);
                    }
                } else {
                    // No date, add to recent
                    recentJobs.push(jobData);
                }
            });
        
        const finalJobs = [...recentJobs, ...olderJobs].slice(0, 25);
        console.log(`   ✅ RemoteOK: ${recentJobs.length} from 24h, ${olderJobs.length} from 7d (total: ${finalJobs.length})`);
        return finalJobs;
        
    } catch (err) {
        console.error(`   ❌ RemoteOK: ${err.message}`);
        return [];
    }
}