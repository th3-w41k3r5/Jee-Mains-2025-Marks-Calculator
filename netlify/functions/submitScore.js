export async function handler(event) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: 'Method Not Allowed',
        };
    }

    const WORKER_SECRET_KEY = process.env.WORKER_SECRET_KEY;

    const body = JSON.parse(event.body);
    const url = body.isAdvanced
        ? "https://adv-score-worker.iitjeepritam.workers.dev/"
        : body.examDate.startsWith("2025-04")
        ? "https://score-worker2.iitjeepritam.workers.dev/"
        : "https://score-worker.iitjeepritam.workers.dev/";

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Worker-Key": WORKER_SECRET_KEY,
            },
            body: JSON.stringify(body.payload),
        });

        const responseText = await response.text();

        return {
            statusCode: response.status,
            body: responseText,
        };
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message }),
        };
    }
}
