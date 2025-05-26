const HCAPTCHA_VERIFY_URL = "https://api.hcaptcha.com/siteverify";

/**
 * Verifies the hCaptcha token.
 * @param {string} captchaToken
 * @param {string} secretKey
 * @param {string} clientIp
 * @returns {Promise<boolean>}
 */
async function verifyCaptcha(captchaToken, secretKey, clientIp) {
    if (!captchaToken) {
        console.log("CAPTCHA verification failed: No token provided.");
        return false;
    }
    if (!secretKey) {
        console.error("CAPTCHA verification failed: HCAPTCHA is not configured.");
        return false;
    }

    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', captchaToken);
    // formData.append('remoteip', clientIp);
    // formData.append('sitekey', 'HCAPTCHA_SITE_KEY');

    try {
        const response = await fetch(HCAPTCHA_VERIFY_URL, {
            method: 'POST',
            body: formData,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        const data = await response.json();
        if (data.success) {
            console.log("CAPTCHA verification successful.");
            return true;
        } else {
            console.warn("CAPTCHA verification failed:", data['error-codes'] || 'No error codes provided');
            return false;
        }
    } catch (error) {
        console.error("CAPTCHA verification request failed:", error);
        return false;
    }
}

export async function handler(event, context) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: 'Method Not Allowed',
        };
    }

    let requestBody;
    try {
        requestBody = JSON.parse(event.body);
    } catch (e) {
        console.error("Invalid JSON payload:", e);
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Invalid JSON payload" }),
        };
    }

    const captchaToken = requestBody.captchaToken;
    const hcaptchaSecretKey = process.env.HCAPTCHA_SECRET_KEY;
    // const clientIp = event.headers['x-nf-client-connection-ip'];

    const captchaVerified = await verifyCaptcha(captchaToken, hcaptchaSecretKey /*, clientIp */);
    if (!captchaVerified) {
        return {
            statusCode: 403,
            body: JSON.stringify({ error: "CAPTCHA verification failed. Please try again." }),
        };
    }


    const { captchaToken: _removedToken, ...scoreData } = requestBody;

    const WORKER_SECRET_KEY = process.env.WORKER_SECRET_KEY;
    if (!WORKER_SECRET_KEY) {
        console.error("WORKER KEY NOT FOUND");
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal server configuration error." }),
        };
    }

    if (!scoreData || typeof scoreData.examDate !== 'string' || typeof scoreData.payload === 'undefined') {
        console.error("Invalid score data structure after CAPTCHA:", scoreData);
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Invalid score data structure. Ensure examDate and payload are present." }),
        };
    }

    const url = scoreData.isAdvanced
        ? "https://adv-score-worker.iitjeepritam.workers.dev/"
        : scoreData.examDate.startsWith("2025-04")
        ? "https://score-worker2.iitjeepritam.workers.dev/"
        : "https://score-worker.iitjeepritam.workers.dev/";

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Worker-Key": WORKER_SECRET_KEY,
                "Origin": "https://j2025scorecard.netlify.app",
            },
            body: JSON.stringify(scoreData.payload),
        });

        const responseText = await response.text();
        const responseContentType = response.headers.get('Content-Type') || 'application/json';

        return {
            statusCode: response.status,
            body: responseText,
            headers: {
                'Content-Type': responseContentType,
                'Access-Control-Allow-Origin': 'https://j2025scorecard.netlify.app',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
            }
        };
    } catch (err) {
        console.error("Error calling worker:", err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to communicate with the score processing service: " + err.message }),
        };
    }
}