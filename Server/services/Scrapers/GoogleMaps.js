import dotenv from 'dotenv';
dotenv.config();

async function scrapeGoogleMaps(keyword, location) {
    const sourceName = 'Google Maps API';
    console.log(`   → ${sourceName}: Fetching...`);

    if (!process.env.RAPID_API_KEY) {
        console.log(`   → ${sourceName}: ⚠️ API key not configured`);
        return [];
    }

    try {
        const requestBody = {
            text: keyword,
            place: location || '',
            street: '',
            city: '',
            country: '',
            state: '',
            postalcode: '',
            latitude: '',
            longitude: '',
            radius: ''
        };

        console.log(`   → ${sourceName}: Searching for "${keyword}" in "${location}"`);

        const response = await fetch('https://google-api31.p.rapidapi.com/map', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-rapidapi-host': 'google-api31.p.rapidapi.com',
                'x-rapidapi-key': process.env.RAPIDAPI_KEY_GOOGLE_MAPS
            },
            body: JSON.stringify(requestBody)
        });

        console.log(`   → ${sourceName}: Response status: ${response.status}`);

        // Handle different error cases
        if (response.status === 403) {
            console.log(`   → ${sourceName}: ⚠️ 403 Forbidden - Check your RapidAPI subscription`);
            return [];
        }

        if (response.status === 429) {
            console.log(`   → ${sourceName}: ⚠️ 429 Rate limit exceeded`);
            return [];
        }

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            console.log(`   → ${sourceName}: ❌ HTTP ${response.status}: ${errorText}`);
            return [];
        }

        const data = await response.json();
        console.log(`   → ${sourceName}: Response received, parsing...`);

        // Check various possible response structures
        let results = [];
        if (data.results && Array.isArray(data.results)) {
            results = data.results;
        } else if (data.data && Array.isArray(data.data)) {
            results = data.data;
        } else if (Array.isArray(data)) {
            results = data;
        } else {
            console.log(`   → ${sourceName}: ⚠️ Unexpected response format:`, Object.keys(data));
            return [];
        }

        if (results.length === 0) {
            console.log(`   → ${sourceName}: No results found`);
            return [];
        }

        // Filter for last 24 hours
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        const jobs = results
            .filter(result => {
                // Check if result has timestamp/date field
                const resultDate = result.timestamp 
                    ? new Date(result.timestamp)
                    : result.date 
                    ? new Date(result.date)
                    : result.posted_date
                    ? new Date(result.posted_date)
                    : result.datePosted
                    ? new Date(result.datePosted)
                    : null;

                // If no date, include it (you can change this to exclude if preferred)
                if (!resultDate) return true;

                // Only include if within last 24 hours
                return resultDate >= twentyFourHoursAgo;
            })
            .map(result => ({
                title: result.title || result.name || result.job_title || 'N/A',
                company: result.company || result.business_name || result.employer || 'N/A',
                location: result.address || result.location || result.city || location || 'Remote',
                description: result.description || result.snippet || result.summary || '',
                url: result.url || result.link || result.maps_url || result.job_url || '#',
                source: sourceName,
                postedDate: result.timestamp || result.date || result.posted_date || result.datePosted || new Date().toISOString(),
                salary: result.salary || result.salaryRange || 'Not specified',
                type: result.job_type || result.type || result.employmentType || 'Full-time',
                category: result.category || result.industry || keyword,
                rating: result.rating || null,
                reviews: result.reviews || result.review_count || null,
                phone: result.phone || result.phone_number || null,
                website: result.website || result.url || null
            }));

        console.log(`   → ${sourceName}: ✅ ${jobs.length} jobs found (${results.length} total, ${jobs.length} within 24h)`);
        return jobs;

    } catch (error) {
        console.error(`   → ${sourceName}: ❌ Error - ${error.message}`);
        return [];
    }
}

export default scrapeGoogleMaps;