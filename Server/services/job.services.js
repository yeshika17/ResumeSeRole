import Job from '../models/Job.js';
import dotenv from 'dotenv';
dotenv.config();




import scrapeRemoteOK from './Scrapers/remoteok.js';
import scrapeRemotive from './Scrapers/Remotive.js';
import scrapeJooble from './Scrapers/Jooble.js';
import scrapeFindWork from './Scrapers/Findwork.js';
import scrapeJSearch from './Scrapers/Jsearch.js';
import scrapeLinkedInJobsAPI from './Scrapers/LinkedInApi.js';
import scrapeActiveJobsDB from './Scrapers/ActiveJobs.js';
import scrapeIndeedAPI from './Scrapers/IndeedAi.js';

import scrapeArbeitnow from './Scrapers/Arbeitnow.js';
import scrapeJobicy from './Scrapers/Jobicy.js';
import scrapeSerpApiGoogleJobs from './Scrapers/Serpapigooglejobs.js';

import scrapeWeWorkRemotelyRSS from './Scrapers/WeWorkRemotelyRSS.js';
import scrapeRemotiveRSS from './Scrapers/RemotiveRSS.js';
import scrapeRemoteOKRSS from './Scrapers/RemoteOKRSS.js';


import scrapeGoogleMaps from './Scrapers/GoogleMaps.js';




const deduplicateJobs = (jobs) => {
    const map = new Map();
    jobs.forEach(j => {
        const key = `${j.title}-${j.company}-${j.location}`
            .toLowerCase()
            .replace(/\s+/g, '');
        if (!map.has(key)) map.set(key, j);
    });
    return Array.from(map.values());
};

// ============================================================
// MAIN AGGREGATOR
// ============================================================
export async function fetchAllJobsService(keyword, location) {

    console.log(`\n${'='.repeat(80)}`);
    console.log(`🚀 COMPLETE JOB AGGREGATION (LAST 24 HOURS ONLY)`);
    console.log(`   Keyword: "${keyword}"`);
    console.log(`   Location: "${location}"`);
    console.log(`   Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
    console.log(`${'='.repeat(80)}`);

    // =======================
    // PHASE 1 — RSS
    // =======================
    console.log('\n📰 Phase 1: RSS Feeds...');
    const rssFeedResults = await Promise.allSettled([
        scrapeWeWorkRemotelyRSS(keyword),
        scrapeRemotiveRSS(keyword),
        scrapeRemoteOKRSS(keyword),
    ]);

    // =======================
    // PHASE 2 — Free APIs (No Key)
    // =======================
    console.log('\n📡 Phase 2: Free APIs (No Key)...');
    const freeAPIsNoKey = await Promise.allSettled([
        scrapeRemoteOK(keyword),
        scrapeRemotive(keyword),
        scrapeArbeitnow(keyword, location),
        scrapeJobicy(keyword, location),
    ]);

    // =======================
    // PHASE 3 — Free APIs (Key)
    // =======================
    console.log('\n🔑 Phase 3: Free APIs (Key Required)...');
    const freeAPIsWithKey = await Promise.allSettled([
        scrapeJooble(keyword, location),
        scrapeFindWork(keyword),
    ]);

    // =======================
    // PHASE 4 — RapidAPI
    // =======================
    console.log('\n⚡ Phase 4: RapidAPI Sources...');
    const rapidAPIResults = await Promise.allSettled([
        scrapeJSearch(keyword, location),
        scrapeActiveJobsDB(keyword, location),
        scrapeLinkedInJobsAPI(keyword, location),
        scrapeIndeedAPI(keyword, location),
        scrapeGoogleMaps(keyword, location), // ← NEW: Added here
    ]);

    // =======================
    // PHASE 5 — Premium / Optional
    // =======================
    console.log('\n💎 Phase 5: Premium / Search Based...');
    const premiumResults = await Promise.allSettled([
        scrapeSerpApiGoogleJobs(keyword, location),
    ]);

    // ============================================================
    // MERGE RESULTS
    // ============================================================
    let allJobs = [];
    const phaseNames = [
        'WeWorkRemotely RSS', 'Remotive RSS', 'RemoteOK RSS',
        'RemoteOK API', 'Remotive API', 'Arbeitnow', 'Jobicy',
        'Jooble', 'FindWork',
        'JSearch', 'ActiveJobsDB', 'LinkedIn API', 'Indeed API', 'Google Maps API', // ← Added
        'Google Jobs (SerpApi)'
    ];

    const allResults = [
        ...rssFeedResults,
        ...freeAPIsNoKey,
        ...freeAPIsWithKey,
        ...rapidAPIResults,
        ...premiumResults
    ];

    console.log(`\n${'='.repeat(80)}`);
    console.log(`📊 RESULTS SUMMARY`);
    console.log(`${'='.repeat(80)}`);

    allResults.forEach((r, i) => {
        const name = phaseNames[i] || 'Unknown Source';
        if (r.status === 'fulfilled') {
            const c = r.value.length;
            console.log(`   ${name.padEnd(30)}: ${c.toString().padStart(3)} ${c > 0 ? '✅' : '⚠️'}`);
            allJobs = allJobs.concat(r.value);
        } else {
            console.log(`   ${name.padEnd(30)}:   0 ❌`);
        }
    });

    
    
    
    const before = allJobs.length;
    allJobs = deduplicateJobs(allJobs);

    console.log(`${'─'.repeat(80)}`);
    console.log(`   AFTER DEDUPLICATION: ${allJobs.length} (removed ${before - allJobs.length})`);

    
    
    
    if (allJobs.length > 0) {
        try {
            await Job.insertMany(allJobs, { ordered: false }).catch(() => { });
            console.log(`\n💾 DATABASE: ${allJobs.length} jobs saved`);
        } catch (err) {
            console.log(`⚠️ DB Error: ${err.message}`);
        }
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log(`✅ AGGREGATION COMPLETED`);
    console.log(`${'='.repeat(80)}\n`);

    return allJobs;
}