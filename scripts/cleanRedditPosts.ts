// Used to clean and get rid of unnceessary fields on reddit posts
import * as fs from 'fs';
import * as path from 'path';
import { EXTRACT_STOCK_TICKERS_PROMPT } from './aiPrompts';
require('dotenv').config();


// Clean script data to remove a bunch of unnecessary fields
async function cleanScriptData(directoryPath: string, file: string) {
    const filePath = path.join(directoryPath + 'scriptDataRaw', file);
    try {
        const data = await fs.promises.readFile(filePath, 'utf8');
        const jsonData = JSON.parse(data);

        const cleanedData = {
            title: jsonData.title,
            score: jsonData.score,
            selftext: jsonData.selftext,
            link_flair_text: jsonData.link_flair_text,
            id: jsonData.id,
            num_comments: jsonData.num_comments,
            created_utc: jsonData.created_utc,
            permalink: jsonData.permalink,
            url_overridden_by_dest: jsonData.url_overridden_by_dest,
            comments: jsonData.comments.map((comment: any) => {
                const mapComment = (comment: any) => ({
                    id: comment.id,
                    score: comment.score,
                    body: comment.body,
                    permalink: comment.permalink,
                    created: comment.created,
                    depth: comment.depth,
                    replies: comment.replies ? comment.replies.map(mapComment) : []
                });
                return mapComment(comment);
            })
        };

        const cleanedFilePath = path.join(directoryPath, 'scriptDataCleaned', file);
        await fs.promises.writeFile(cleanedFilePath, JSON.stringify(cleanedData, null, 2), 'utf8');
    } catch (err) {
        console.log('Unable to clean file: ' + err);
    }
}

// Reads, cleans, and saves the new data
async function readCleanAndSave() {
    const directoryPath = path.join(__dirname, '../scriptData/');
    const cleanedDirectoryPath = path.join(__dirname, '../scriptData/scriptDataCleaned');

    try {
        const files = await fs.promises.readdir(directoryPath+'scriptDataRaw');
        console.log(`Number of files to clean: ${files.length}`);

        for (const file of files) {
            await cleanScriptData(directoryPath, file);
        }

        console.log('All files have been cleaned and saved to the scriptDataCleaned folder.');
    } catch (err) {
        console.log('Error reading files: ' + err);
    }
}

// readCleanAndSave()