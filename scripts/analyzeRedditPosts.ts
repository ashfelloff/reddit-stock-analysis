// script to analyze scriptData folder using AI to get sentiment

import * as fs from 'fs';
import * as path from 'path';
import { CLASSIFY_SENTIMENT_REDDIT_PROMPT, EXTRACT_STOCK_TICKERS_PROMPT } from './aiPrompts';
require('dotenv').config();
const { OpenAI } = require("openai");


const gpt4oEndpoint =process.env.AZURE_OPENAI_EASTUS2_ENDPOINT // gpt-4o uses a different region than gpt-3
const gpt4oApiKey = process.env.AZURE_OPENAI_EASTUS2_API_KEY
const gpt4oDeployment = "gpt-4o"

const apiKey = process.env.AZURE_OPENAI_API_KEY
const apiVersion = "2023-05-15"


const POLYGON_STOCKS_API_KEY = process.env.POLYGON_STOCKS_API_KEY;

// Because of how OpenAI client is laid out, you need a new client for gpt-3.5 and one for gpt-4o
// Helicone is used for tracking costs, can remove baseURL if you don't want to use helicone
const gpt4oClient = new OpenAI({
    baseURL: "https://oai.hconeai.com/openai/deployments/" + gpt4oDeployment,
    apiKey: apiKey,
    defaultHeaders: {
        "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
        "Helicone-OpenAI-API-Base": gpt4oEndpoint,
        "api-key": gpt4oApiKey,
    },
    defaultQuery: { "api-version": apiVersion },
});

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getCompletionForQuery(query: string, user: string = "analyzeRedditPosts", maxTokens: number = 1000): Promise<string> {

    let messages = [{ role: 'user', content: query }]

    let clientToUse = gpt4oClient

    const chatCompletion = await clientToUse.chat.completions.create({messages,
        model: "",
        max_tokens: maxTokens,
        user:user,});

    // console.log(JSON.stringify(chatCompletion, null, 2));
    let response = chatCompletion.choices[0].message.content;
    console.log(response)
    return response
}

// getCompletionForQuery("Tell me a funny joke. Respond only in JSON", "analyzeRedditPosts")




async function readAndExtractTickersForAllFiles() {
    const directoryPath = path.join(__dirname, '../scriptData/scriptDataCleaned');

    try {
        const files = await fs.promises.readdir(directoryPath);
        console.log(`Number of files: ${files.length}`);
        const fourHundredKarmaPosts: number[] = [];  // Assuming scores are numbers

        let combinedString = ''
        let countOfAnalyzedPosts = 0
        for (const file of files) {
            const filePath = path.join(directoryPath, file);
            try {
                const data = await fs.promises.readFile(filePath, 'utf8');
                const jsonData = JSON.parse(data);
                
                /**
                 * // ToDo // make sure to skip "link_flair_text": "Meme",
                 * // Should we analyze comments for news flair?
                 */

                combinedString += ` ${jsonData.title} + ${jsonData.score} + ${jsonData.selftext} `;

                // For now, only analyze posts with >400 karma
                if(jsonData.score > 400) {
                    fourHundredKarmaPosts.push(jsonData.score)
                    
                    if(jsonData.selftext != null && jsonData.selftext.length > 80) {
                        // Skip first 10 for now, we've already tested. Test a different set
                        if(countOfAnalyzedPosts <= 30) {
                            continue
                        }
                        console.log('countOfAnalyzedPosts - used to mark the level of processing ' + countOfAnalyzedPosts)

                        if(countOfAnalyzedPosts >= 40) {
                            break;
                        }

                        console.log(jsonData.id)
                        const postText = `${jsonData.title}\n\n${jsonData.selftext}`
                        console.log('=============')
                        
                        const classifySentimentPrompt = CLASSIFY_SENTIMENT_REDDIT_PROMPT.replace("<post_text>", postText)

                        console.log(classifySentimentPrompt)

                        /** Extract tickers logic */
                        // const extractTickersPrompt = EXTRACT_STOCK_TICKERS_PROMPT.replace("<post_text>", postText)
                        // console.log(extractTickersPrompt)
                        // const tickersAIResponse = await getCompletionForQuery(extractTickersPrompt)
                        // const tickersAIResponseJSON = JSON.parse(tickersAIResponse.replace('```json', '').replace('```', ''));
                        // jsonData.stockTickers = tickersAIResponseJSON;
                        // await fs.promises.writeFile(filePath, JSON.stringify(jsonData, null, 2), 'utf8'); // Write it back to file so we have it saved
                        // console.log(tickersAIResponseJSON)
                        /**  */

                        console.log('=============')
                    
                    }
                }
            } catch (err) {
                console.log(`Unable to read file: ${file}` + err);
            }
        }
        console.log(`Length of combined string: ${combinedString.length}`);
        console.log(`Number of posts with > 400 karma: ${fourHundredKarmaPosts.length}`)

    } catch (err) {
        console.log('Unable to scan directory: ' + err);
    }
}

// readAndExtractTickersForAllFiles();


/**
 * Reads all files and classifies sentiment
 */
async function readAndClassifySentimentOfAllFiles() {
    const directoryPath = path.join(__dirname, '../scriptData/scriptDataCleaned');

    try {
        const files = await fs.promises.readdir(directoryPath);
        console.log(`Number of files: ${files.length}`);
        const fourHundredKarmaPosts: number[] = [];  // Assuming scores are numbers

        let combinedString = ''
        let countOfAnalyzedPosts = 0
        for (const file of files) {
            const filePath = path.join(directoryPath, file);
            try {
                const data = await fs.promises.readFile(filePath, 'utf8');
                const jsonData = JSON.parse(data);
                
                /**
                 * // ToDo // make sure to skip "link_flair_text": "Meme",
                 * // Should we analyze comments for news flair?
                 */

                combinedString += ` ${jsonData.title} + ${jsonData.score} + ${jsonData.selftext} `;

                // For now, only analyze posts with >400 karma
                if(jsonData.score > 400) {
                    fourHundredKarmaPosts.push(jsonData.score)
                    
                    if(jsonData.selftext != null && jsonData.selftext.length > 80) {

                        // Skip because there's no ticker
                        if(jsonData.stockTickers == undefined || jsonData.stockTickers.main_ticker == undefined || jsonData.stockTickers.main_ticker[0] == undefined) {
                            continue
                        }
                        countOfAnalyzedPosts += 1
                        // Skip first 10 for now, we've already tested. Test a different set
                        if(countOfAnalyzedPosts < 500) {
                            continue
                        }
                        console.log('countOfAnalyzedPosts - used to mark the level of processing ' + countOfAnalyzedPosts)

                        if(countOfAnalyzedPosts >= 1100) {
                            break;
                        }

                        console.log(jsonData.id)
                        const postText = `${jsonData.title}\n\n${jsonData.selftext}`
                        console.log('=============')
                        
                        const classifySentimentPrompt = CLASSIFY_SENTIMENT_REDDIT_PROMPT.replace("<post_text>", postText)

                        console.log(classifySentimentPrompt)

                        /** Extract tickers logic */
                        // const extractTickersPrompt = EXTRACT_STOCK_TICKERS_PROMPT.replace("<post_text>", postText)
                        // console.log(extractTickersPrompt)
                        const sentimentAIResponse = await getCompletionForQuery(classifySentimentPrompt)
                        const sentimentAIResponseJSON = JSON.parse(sentimentAIResponse.replace('```json', '').replace('```', ''));
                        jsonData.sentimentAnalysis = sentimentAIResponseJSON;
                        await fs.promises.writeFile(filePath, JSON.stringify(jsonData, null, 2), 'utf8'); // Write it back to file so we have it saved
                        console.log(sentimentAIResponseJSON)
                        /**  */

                        console.log('=============')
                    
                    }
                }
            } catch (err) {
                console.log(`Unable to read file: ${file}` + err);
            }
        }
        console.log(`Length of combined string: ${combinedString.length}`);
        console.log(`Number of posts with > 400 karma: ${fourHundredKarmaPosts.length}`)

    } catch (err) {
        console.log('Unable to scan directory: ' + err);
    }
}

// readAndClassifySentimentOfAllFiles()


/**
 * After we've extracted tickers and done sentiment analysis, run this to read through files
 * This function reads through all json files, counts the sentiment, and measure stock performance based on price
 */
async function readThroughAllFilesAndCountSentimentAndMeasureStockPerformance() {
    const directoryPath = path.join(__dirname, '../scriptData/scriptDataCleaned');

    try {
        const files = await fs.promises.readdir(directoryPath);
        console.log(`Number of files: ${files.length}`);
        const tickersDict: { 
            [key: string]: { 
                count: number, 
                countPositiveSentiment: number, 
                countNegativeSentiment: number, 
                countNeutralSentiment: number, 
                countBuy: number, 
                countSell: number, 
                countNoBuyOrSell: number 
            } 
        } = {};

        const stockPriceData: { [key: string]: any[] } = {}; // Used to keep all the stock price data we get from Alpaca

        for (const file of files) {
            const filePath = path.join(directoryPath, file);
            try {
                const fileContent = await fs.promises.readFile(filePath, 'utf8');
                const jsonData = JSON.parse(fileContent);
                // Skip because there's no ticker
                if(jsonData.stockTickers == undefined || jsonData.stockTickers.main_ticker == undefined || jsonData.stockTickers.main_ticker[0] == undefined) {
                    continue
                }
                const sentimentAnalysis = jsonData.sentimentAnalysis

                if(sentimentAnalysis == undefined ) {
                    console.log(`Skipping ${jsonData.id} because sentiment analysis is null`)
                }

                const mainTicker = jsonData.stockTickers.main_ticker[0]
                
                /** Save all the sentiment data to use later */
                const buyOrSell = sentimentAnalysis.buy_or_sell
                const sentiment = sentimentAnalysis.sentiment

                if (mainTicker) {
                    if (tickersDict.hasOwnProperty(mainTicker)) {
                        tickersDict[mainTicker].count += 1;
                    } else {
                        tickersDict[mainTicker] = {
                            count: 1,
                            countPositiveSentiment: 0,
                            countNegativeSentiment: 0,
                            countNeutralSentiment: 0,
                            countBuy: 0,
                            countSell: 0,
                            countNoBuyOrSell: 0
                        };
                    }

                    if (buyOrSell) {
                        if (buyOrSell.toLowerCase() === 'buy') {
                            tickersDict[mainTicker].countBuy += 1;
                        } else if (buyOrSell.toLowerCase() === 'sell') {
                            tickersDict[mainTicker].countSell += 1;
                        }
                    } else {
                        tickersDict[mainTicker].countNoBuyOrSell += 1;
                    }

                    if (sentiment) {
                        if (sentiment.toLowerCase() === 'positive') {
                            tickersDict[mainTicker].countPositiveSentiment += 1;
                        } else if (sentiment.toLowerCase() === 'negative') {
                            tickersDict[mainTicker].countNegativeSentiment += 1;
                        } else if (sentiment.toLowerCase() === 'neutral') {
                            tickersDict[mainTicker].countNeutralSentiment += 1;
                        }
                    }
                }
                // console.log(tickersDict)

                /** Get stock price data */
                jsonData.stockPrices = {};

                const dateOfRedditPost = epochToPSTDate(jsonData.created_utc); // Date object

                const stockPriceOnPostDate = findStockPriceForStockOnDate(mainTicker, dateOfRedditPost);
                // console.log(`Ticker: ${mainTicker}, Stock Price on Post Date: ${stockPriceOnPostDate.vw}, Formatted Date: ${dateOfRedditPost}, Post ID: ${jsonData.id}`);
                jsonData.stockPrices.stockPriceOnPostDate = stockPriceOnPostDate.vw;

                const datePlus1 = new Date(dateOfRedditPost);
                datePlus1.setDate(datePlus1.getDate() + 1);
                const stockPricePlus1 = findStockPriceForStockOnDate(mainTicker, datePlus1);
                const gainOrLossPlus1 = stockPricePlus1.vw - stockPriceOnPostDate.vw;
                // console.log(`Ticker: ${mainTicker}, Stock Price on Date +1: ${stockPricePlus1.vw}, Gain/Loss: ${gainOrLossPlus1}, Formatted Date: ${datePlus1}, Post ID: ${jsonData.id}`);
                jsonData.stockPrices.stockPricePlus1 = stockPricePlus1.vw;
                jsonData.stockPrices.gainOrLossPlus1 = gainOrLossPlus1;

                const datePlus7 = new Date(dateOfRedditPost);
                datePlus7.setDate(datePlus7.getDate() + 7);
                const stockPricePlus7 = findStockPriceForStockOnDate(mainTicker, datePlus7);
                const gainOrLossPlus7 = stockPricePlus7.vw - stockPriceOnPostDate.vw;
                // console.log(`Ticker: ${mainTicker}, Stock Price on Date +7: ${stockPricePlus7.vw}, Gain/Loss: ${gainOrLossPlus7}, Formatted Date: ${datePlus7}, Post ID: ${jsonData.id}`);
                jsonData.stockPrices.stockPricePlus7 = stockPricePlus7.vw;
                jsonData.stockPrices.gainOrLossPlus7 = gainOrLossPlus7;

                const datePlus28 = new Date(dateOfRedditPost);
                datePlus28.setDate(datePlus28.getDate() + 28);
                const stockPricePlus28 = findStockPriceForStockOnDate(mainTicker, datePlus28);
                const gainOrLossPlus28 = stockPricePlus28.vw - stockPriceOnPostDate.vw;
                // console.log(`Ticker: ${mainTicker}, Stock Price on Date +28: ${stockPricePlus28.vw}, Gain/Loss: ${gainOrLossPlus28}, Formatted Date: ${datePlus28}, Post ID: ${jsonData.id}`);
                jsonData.stockPrices.stockPricePlus28 = stockPricePlus28.vw;
                jsonData.stockPrices.gainOrLossPlus28 = gainOrLossPlus28;

                const dateOnNov13 = new Date('2024-11-13T00:00:00Z'); // This is the last day of stock data we have
                const stockPriceOnNov13 = findStockPriceForStockOnDate(mainTicker, dateOnNov13);
                const gainOrLossOnNov13 = stockPriceOnNov13.vw - stockPriceOnPostDate.vw;
                // console.log(`Ticker: ${mainTicker}, Stock Price on 11-12: ${stockPriceOnNov13.vw}, Gain/Loss: ${gainOrLossOnNov13}, Formatted Date: ${dateOnNov13}, Post ID: ${jsonData.id}`);
                jsonData.stockPrices.stockPriceOnNov13 = stockPriceOnNov13.vw;
                jsonData.stockPrices.gainOrLossOnNov13 = gainOrLossOnNov13;

                const csvHeaders = 'PostID,Permalink,FormattedDateOfRedditPost,Ticker,StockPriceOnPostDate,StockPricePlus1,GainOrLossPlus1,StockPricePlus7,GainOrLossPlus7,StockPricePlus28,GainOrLossPlus28,StockPriceOnNov13,GainOrLossOnNov13,Sentiment,BuyOrSell';
                // console.log(csvHeaders);
                const formattedDateOfRedditPost = dateOfRedditPost.toISOString().split('T')[0]; // Format date to YYYY-MM-DD
                const csvRow = `${jsonData.id},${jsonData.permalink},${formattedDateOfRedditPost},${mainTicker},${stockPriceOnPostDate.vw},${stockPricePlus1.vw},${gainOrLossPlus1},${stockPricePlus7.vw},${gainOrLossPlus7},${stockPricePlus28.vw},${gainOrLossPlus28},${stockPriceOnNov13.vw},${gainOrLossOnNov13},${sentiment ?? 'null'},${buyOrSell ?? 'null'}`;

                // const fs = require('fs');
                // const path = require('path');
                const finalStockAnalysisFilePath = path.join(__dirname, '../scriptData/finalStockAnalysis.csv');

                fs.appendFile(finalStockAnalysisFilePath, csvRow + '\n', (err) => {
                    if (err) {
                        console.error('Error writing to finalStockAnalysis.csv:', err);
                    } else {
                        console.log('CSV row successfully added to finalStockAnalysis.csv');
                    }
                });
            } catch (err) {
                console.log(`Unable to read or parse file: ${file}` + err);
            }
        }
        const sortedTickers = Object.entries(tickersDict).sort((a, b) => b[1].count - a[1].count);
        const csvHeaders = 'Ticker,Count,CountPositiveSentiment,CountNegativeSentiment,CountNeutralSentiment,CountBuy,CountSell,CountNoBuyOrSell';
        // console.log(csvHeaders);

        sortedTickers.forEach(([ticker, data]) => {
            const csvRow = `${ticker},${data.count},${data.countPositiveSentiment},${data.countNegativeSentiment},${data.countNeutralSentiment},${data.countBuy},${data.countSell},${data.countNoBuyOrSell}`;
            // console.log(csvRow);
        });
    } catch (err) {
        console.log('Unable to scan directory: ' + err);
    }
}




// 5 API calls per minute
async function getStockPrice(ticker: string): Promise<any> {
    const url = `https://data.alpaca.markets/v2/stocks/bars?symbols=${ticker}&timeframe=1D&start=2024-01-03T00%3A00%3A00Z&end=2024-11-14T00%3A00%3A00Z&limit=1000&adjustment=split&feed=sip&sort=asc`;

    try {
        const response = await fetch(url, {
            headers: new Headers({
                'APCA-API-KEY-ID': process.env.ALPACA_API_KEY || '',
                'APCA-API-SECRET-KEY': process.env.ALPACA_API_SECRET || '',
                'accept': 'application/json'
            })
        });
        if (!response.ok) {
            throw new Error(`Error fetching stock price: ${response.statusText}`);
        }
        const data = await response.json() as { bars: { [key: string]: any[] } };
        // console.log(data.bars[ticker]);

        /**
         * Alpaca data format
         * c = close
         * h = high price
         * l = low price
         * n = trade count
         * o = opening price
         * t= timestamp
         * v = volume
         * vw = volume weighted average price
         * {
      "c": 173.31,
      "h": 173.6,
      "l": 170.11,
      "n": 670630,
      "o": 170.41,
      "t": "2024-03-27T04:00:00Z",
      "v": 60273265,
      "vw": 172.581734
    },
         */
        return data.bars[ticker];
    } catch (error) {
        console.error(`Error fetching stock price for ${ticker}:`, error);
        throw error;
    }
}

// getStockPrice('AAPL');

async function getAllStockPricesAndSave(tickers: string[]): Promise<void> {
    const allStockPrices: { [key: string]: any } = {};

    for (const ticker of tickers) {
        try {
            const stockData = await getStockPrice(ticker);
            allStockPrices[ticker] = stockData;
        } catch (error) {
            console.error(`Failed to get stock price for ${ticker}:`, error);
        }
    }

    try {
        const filePath = path.join(__dirname, '../scriptData/stockPrices.json');
        await fs.promises.writeFile(filePath, JSON.stringify(allStockPrices, null, 2));
        console.log(`Stock prices saved to ${filePath}`);
    } catch (error) {
        console.error('Error saving stock prices to file:', error);
    }
}

// getAllStockPricesAndSave(["NVDA","TSLA","SPY","INTC","BA","AAPL","GOOGL","ASTS","CRWD","AMZN","META","DJT","PLTR","MSFT","QQQ","BRK.A","TSM","NFLX","SBUX","HOOD","AMD","CVNA","HIMS","MCD","RKLB","SMCI","COST","LUNR","SPX","CRM","DIS","GOOG","RDDT","AMC","CMG","DELL","JPM","S&P 500","DWAC","TQQQ","GME","BBWI","CSCO","RIVN","NKE","BAC","ACHR","BB","TLRY","UBER","SOFI","PARA","ARM","WEN","CAVA","SCHW","TNDM","BABA","SNDL","GRND","OXY","WFC","A","COIN","LUMN","WMT","MSOS","CLOV","GS","PEP","PAA","PM","PVH","UWMC","MS","DNUT","SMG","FRC","SNAP","WING","PLAY","NQ","ALCC","SNOW","SONY","SHOP","VSTS","PCG","BCAN","BP","SPWR","AAP","MMAT","DKS","HPE","LULU","BRKA","WM","EBAY","GDDY","TPR","EPI","VGT","DAL","AAL","WBA","CHWY","CORZ","CVX","IWM","ETSY","TDOC","ABT","AYX","LLY","SPOT","COF","MTCH","PYPL","NTDOY","KO","UVXY","IXIC","9984.T","ABNB","BRK.B","RDFN","BMBL","M","XOM","RILY","LYFT","IRM","GM","IEP","VOO","SMH","U.UN","PTON","MO","MRNA","P","DG","IBM","N","JWN","V","SVNDY","F","BRK-B","NSRGY","TMF","MDLZ","VTLE","BLK","QCOM","UAV","NIO","BRK","BBBY","SAVE","CEG","RACE","YINN","TIGR","GNRC","MSTR","ASML","URNM","FMCC","O","JOBY","FVRR","IONQ","TECL","VWAGY","NRDS","LCID","FAS","FNMA","SMR"])

/**
 * Finds stock price on a specific date
 * @param stock 
 * @param date 
 * @returns 
 */
function findStockPriceForStockOnDate(stock: string, dateObject: Date): any | null {
    let date = formatDateToString(dateObject);
    const stockData = ALL_STOCK_PRICES[stock];
    if (!stockData) {
        console.error(`No data found for stock: ${stock}`);
        return null;
    }

    let stockPrice = stockData.find((entry: any) => {
        const entryDate = new Date(entry.t).toISOString().split('T')[0];
        return entryDate === date;
    });

    if (!stockPrice) {
        // console.error(`No stock price found for ${stock} on date: ${date}. Assuming weekend or worst case Friday holiday. Trying next available dates.`);
        for (let i = 1; i <= 3; i++) {
            const nextDateObject = new Date(dateObject);
            nextDateObject.setDate(nextDateObject.getDate() + i);
            const nextDate = formatDateToString(nextDateObject);
            stockPrice = stockData.find((entry: any) => {
                const entryDate = new Date(entry.t).toISOString().split('T')[0];
                return entryDate === nextDate;
            });
            if (stockPrice) {
                // console.log(`Found stock price for ${stock} on date: ${nextDate}`);
                break;
            }
        }
    }

    if (!stockPrice) {
        console.error(`No stock price found for ${stock} on date: ${date} or the next 3 days.`);
        return null;
    }

    return stockPrice;
}





// Global variable that holds all stock prices
let ALL_STOCK_PRICES: { [key: string]: Array<{ c: number, h: number, l: number, n: number, o: number, t: string, v: number, vw: number }> } = {};

async function readStockPricesFromFile(): Promise<void> {
    try {
        const filePath = path.join(__dirname, '../scriptData/stockPrices.json');
        const data = await fs.promises.readFile(filePath, 'utf-8');
        const stockPrices = JSON.parse(data);
        ALL_STOCK_PRICES = stockPrices
    } catch (error) {
        console.error('Error reading stock prices from file:', error);
    }
}

/** MAIN */

// Read in stock prices that we pre-pulled from Alpaca instead of calling a slow Alpaca API a bunch of times
readStockPricesFromFile().then(() => {
    console.log('Stock prices have been successfully read from the file.');
    // console.log(findStockPriceForStockOnDate('NVDA', '2024-11-06'))
});

// testing

// Main function to read through a bunch of JSON files for reddit post that already have sentiment analysis and measure performance based on stock prices
readThroughAllFilesAndCountSentimentAndMeasureStockPerformance();

/**
 * Converts a UTC epoch to a PST Date
 * @param epoch 
 * @returns 
 */
function epochToPSTDate(epoch: number): Date {
    // Multiply by 1000 to convert seconds to milliseconds
    const date = new Date(epoch * 1000);
    // Convert to GMT-08:00 timezone
    const offset = -8 * 60; // GMT-08:00 offset in minutes
    const localTime = date.getTime();
    const localOffset = date.getTimezoneOffset() * 60000; // Local offset in milliseconds
    const gmtMinus8Time = new Date(localTime + localOffset + offset * 60000);
    return gmtMinus8Time;
}

/**
 * Converts a date to string that follows this format `2024-01-03`
 * Why the `2024-01-03` format? Because the stock price dates are in that format
 * @param date 
 * @returns 
 */
function formatDateToString(date: Date): string {
    // Format the date as "YYYY-MM-DD"
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
// Example usage:
// const epochTime = 1731262869;
// const formattedData = formatDateToString(epochToPSTDate(epochTime));
// console.log(formattedData);

