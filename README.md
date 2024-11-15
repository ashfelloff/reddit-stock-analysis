# Reddit AI stock analysis

## WTF is this even

I've always wanted to see how well Reddit actually was at picking stonks. And see what the returns were. So I analyzed the stock performance based on posts from Reddit's WallStreetBets and Stocks subreddits. I used AI (specifically gpt-4o) to do a sentiment analysis and extract any stock tickers from posts to measure stock performance.


## Some notes

- I mainly got posts that were >400 karma. These posts were between March 2024 and Nov 2024.
- I used gpt-4o for sentiment analysis and to determine if the poster was recommending a buy or sell. Note that this wasn't perfect and some may be wrong (e.g. if someone is upset they lost a lot of money, the sentiment would be negative.)
- I used a Volume weighted average price to get the price of the stock for each day.
- If the post (or next few days) landed on a weekend or holiday, I would go grab the next day for stock prices

## Want daily/instant updates in your email/Discord?

I decided to turn this into a product so you can get instant (or daily summaries) updates for stocks and sentiment on Reddit! It's free, try it here [Fluid](https://withfluid.com/)

## Want to run this yourself?

### getRedditPosts

This module is responsible for fetching posts from the WallStreetBets and Stocks subreddits. It utilizes the Reddit API to gather the latest discussions, which are then stored for further analysis. The focus is on capturing posts with high engagement, as these are more likely to influence stock movements.

### cleanRedditPosts

Once the Reddit posts are fetched, this module processes and cleans the data. It removes unnecessary information, filters out irrelevant content, and prepares the text for sentiment analysis. The goal is to ensure that the data is in a consistent format, making it easier to extract meaningful insights.

### analyzeRedditPosts

This module performs sentiment analysis on the cleaned Reddit posts. It evaluates the overall sentiment of the discussions and correlates it with historical stock prices. By doing so, it attempts to measure the potential impact of Reddit discussions on stock performance, providing valuable insights for investors and analysts.
