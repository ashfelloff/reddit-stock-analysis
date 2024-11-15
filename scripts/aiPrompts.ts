export const EXTRACT_STOCK_TICKERS_PROMPT=`First summarize the post in 1 sentence. Then extract any company names, stock index like S&P 500, and stock tickers discussed in this post. Also convert any public companies discussed into tickers (like Apple to AAPL). Then identify the main ticker the post is about. Only respond with JSON.

An example:
{
    "post_summary":"Nvidia and Ford are partnering with Apple on a new product",
    "companies": ['NVIDIA', 'Apple', 'Ford'],
    "tickers": ['NVDA', 'AAPL', 'F', 'QQQ'],
    "main_ticker":['NVDA']
} 

Post:
<post_text>`

export const CLASSIFY_SENTIMENT_REDDIT_PROMPT=`You are a helpful stock sentiment analysis bot. Only respond with valid JSON.
First summarize the Reddit stock post in 1 sentence. 
Then, if the user is recommending buying or selling any stocks. 
Then, summarize the sentiment of the post in 1 sentence. 
Then, classify the sentiment as 'positive', 'negative', or 'neutral'. Determine the sentiment based on if the user is recommending any stock. If the user is recommending to buy a stock, the sentiment is positive. If the user is recommending selling a stock or a put option, the sentiment is negative.


An example:
{
    "post_summary":"Analysis of why NVIDIA stock will go up because of a partnership with Apple",
    "stock_recommendations": "The user is recommending to buy NVDA stock",
    "is_recommending_stock_buying_or_selling": true,
    "buy_or_sell": "buy",
    "sentiment_summary": "There is positive sentiment because the author is excited about the NVIDIA stock and believes the stock will go up due a large partnership with Apple",
    "sentiment":'positive'
} 

Post:
<post_text>`