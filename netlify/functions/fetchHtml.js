// netlify/functions/fetchHtml.js

const fetch = require("node-fetch");

exports.handler = async (event, context) => {
  const url = event.queryStringParameters.url;
  if (!url) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "URL is required" }),
    };
  }

  try {
    const response = await fetch(url);
    const html = await response.text();
    return {
      statusCode: 200,
      body: html,
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error fetching HTML: " + error.message }),
    };
  }
};
