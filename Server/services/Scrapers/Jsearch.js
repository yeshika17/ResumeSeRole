 import axios from 'axios';
 export default async function scrapeJSearch(keyword, location) {
     try {
         console.log(`\n🔍 [JSearch] Fetching jobs from last 24h...`);
         const apiKey = process.env.RAPID_API_KEY;
         
         if (!apiKey) {
             console.log('   ⚠️ RapidAPI key not configured');
             return [];
         }
         
         const url = 'https://jsearch.p.rapidapi.com/search';
         
         const response = await axios.get(url, {
             params: {
                 query: `${keyword} in ${location || 'India'}`,
                 page: '1',
                 num_pages: '1',
                 date_posted: 'today' // LAST 24 HOURS
             },
             headers: {
                 'X-RapidAPI-Key': apiKey,
                 'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
             },
             timeout: 15000
         });
         
         if (!response.data || !response.data.data) {
             console.log('   ⚠️ No data returned');
             return [];
         }
         
         const jobs = response.data.data
             .slice(0, 20)
             .map(j => ({
                 title: j.job_title || 'Position',
                 company: j.employer_name || 'Company',
                 location: j.job_city && j.job_country 
                     ? `${j.job_city}, ${j.job_country}`
                     : j.job_country || location,
                 link: j.job_apply_link || j.job_google_link || '',
                 source: 'JSearch (24h)',
                 description: j.job_description ? j.job_description.slice(0, 200) : '',
                 postedDate: j.job_posted_at_datetime_utc ? new Date(j.job_posted_at_datetime_utc) : new Date()
             }));
         
         console.log(`   ✅ JSearch: ${jobs.length} jobs (API filtered to 24h)`);
         return jobs;
         
     } catch (err) {
         console.error(`   ❌ JSearch: ${err.message}`);
         if (err.response?.status === 429) console.log('   ⚠️ Rate limit exceeded');
         return [];
     }
 }
