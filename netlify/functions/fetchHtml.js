import fetch from 'node-fetch';

export async function handler(event, context) {
    const url = event.queryStringParameters.url;

    try {
        const response = await fetch(url);
        const html = await response.text();

        return {
            statusCode: 200,
            body: html,
            headers: {
                'Content-Type': 'text/html',
                'Access-Control-Allow-Origin': '*'
            }
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: `Failed to fetch HTML: ${error.message}`
        };
    }
}