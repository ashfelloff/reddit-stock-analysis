// Self contained Script (no dependencies to other files in this project) to get all reddit posts, with post ids coming from processed_wsb_submissions

require('dotenv').config();
const fs = require('fs');

const { Client, Pool } = require('pg');
const client = new Pool({connectionString: process.env.POSTGRES_URL})
const snoowrap = require('snoowrap');

const r = new snoowrap({
    userAgent: process.env.REDDIT_POST_USER_AGENT,
    clientId: process.env.REDDIT_POST_CLIENT_ID,
    clientSecret: process.env.REDDIT_POST_CLIENT_SECRET,
    username: process.env.REDDIT_POST_USERNAME,
    password: process.env.REDDIT_POST_PASSWORD
});



function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getAllRedditPostIds(): Promise<string[]> {
    const query = 'SELECT reddit_post_id FROM processed_wsb_submissions';
    const res = await client.query(query);
    return res.rows.map((row: { reddit_post_id: string }) => row.reddit_post_id);
}

async function grabAllRedditPosts(): Promise<string[]> {
    const postIds: string[] = await getAllRedditPostIds();
    const redditPosts: string[] = [];

    for (const postId of postIds) {
        if (fs.existsSync(`scriptData/${postId}.json`)) {
            console.log(`File scriptData/${postId}.json already exists. Skipping...`);
            continue;
        }

        try {
            const submission = await r.getSubmission(postId).fetch();
            
            fs.writeFileSync(`scriptData/${postId}.json`, JSON.stringify(submission, null, 2));
            console.log(submission.title);
            console.log(submission.score);
            await sleep(1000);
        } catch (error) {
            console.log(`Error fetching submission for postId ${postId}:`, error);
            continue;
        }
    }

    console.log(postIds.length)
    return redditPosts;
}

grabAllRedditPosts();