document.getElementById("percentileForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const score = parseFloat(document.getElementById("score").value);
    const mathsScore = parseFloat(document.getElementById("mathScore").value);
    const phyScore = parseFloat(document.getElementById("phyScore").value);
    const chemScore = parseFloat(document.getElementById("chemScore").value);
    const examShift = document.getElementById("examShift").value;

    const modal = document.getElementById("modal");
    const modalContent = modal.querySelector("div");
    const modalScore = document.getElementById("modalScore");
    const modalPercentile = document.getElementById("modalPercentile");
    const modalScoresRecorded = document.getElementById("modalScoresRecorded");
    const modalExamShift = document.getElementById("modalExamShift");
    const closeModal = document.getElementById("closeModal");

    const limitModal = document.getElementById("limitModal");
    const timerDisplay = document.getElementById("timerDisplay");
    const closeLimitModal = document.getElementById("closeLimitModal");

    const calculateText = document.getElementById("calculateText");
    const loadingSpinner = document.getElementById("loadingSpinner");

    const shiftMap = {
        "2025-01-22-shift-1": "22s1",
        "2025-01-22-shift-2": "22s2",
        "2025-01-23-shift-1": "23s1",
        "2025-01-23-shift-2": "23s2",
        "2025-01-24-shift-1": "24s1",
        "2025-01-24-shift-2": "24s2",
        "2025-01-28-shift-1": "28s1",
        "2025-01-28-shift-2": "28s2",
        "2025-01-29-shift-1": "29s1",
        "2025-01-29-shift-2": "29s2"
    };
    const formattedExamShift = shiftMap[examShift] || "Unknown Shift";

    const requestData = JSON.parse(localStorage.getItem("percentileRequests")) || { count: 0, resetAt: null };
    const now = Date.now();

    if (requestData.count >= 10 && now < requestData.resetAt) {
        limitModal.classList.remove("hidden");
        startCountdown(requestData.resetAt);
        return;
    }

    calculateText.textContent = "Calculating...";
    loadingSpinner.classList.remove("hidden");

    const timeout = setTimeout(() => {
        calculateText.textContent = "Taking longer than usual...";
    }, 5000);

    try {
        const CORS_PROXY = "https://cors-proxy.novadrone16.workers.dev";
        const API_URL = "https://percentile-predictor.iitjeepritam.workers.dev/api/calculatePercentile";

        const response = await fetch(`${CORS_PROXY}?url=${encodeURIComponent(API_URL)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ score, mathsScore, phyScore, chemScore, examShift }),
        });

        clearTimeout(timeout);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Error calculating percentile.");
        }
    

        const data = await response.json();

        if (!data.percentile || isNaN(data.percentile)) {
            throw new Error("Invalid percentile received from API.");
        }

        if (data.serverTimeUTC) {
            const resetAt = new Date(data.serverTimeUTC).getTime() + 12 * 60 * 60 * 1000;
            requestData.count += 1;
            requestData.resetAt = resetAt;
            localStorage.setItem("percentileRequests", JSON.stringify(requestData));
        }

        calculateText.textContent = "Calculate Percentile";
        loadingSpinner.classList.add("hidden");

        modalScore.innerHTML = `<span class="text-blue-400 font-bold">${score}</span>`;
        modalPercentile.innerHTML = `<span class="text-green-400 font-bold text-xl">${parseFloat(data.percentile).toFixed(2)}%ile</span>`;
        modalExamShift.innerHTML = `<span class="text-yellow-400 font-semibold">${formattedExamShift}</span>`;
        modalScoresRecorded.innerHTML = `<span class="text-white">${data.totalScoresRecorded} </span>`;
        document.getElementById("modalExamShiftInline").textContent = formattedExamShift;

        modal.classList.remove("hidden");
        setTimeout(() => modalContent.classList.add("scale-100", "opacity-100"), 10);

        closeModal.addEventListener("click", () => {
            modalContent.classList.remove("scale-100", "opacity-100");
            setTimeout(() => modal.classList.add("hidden"), 300);
        });

    } catch (error) {
        console.error(error);
        alert(error.message);

        clearTimeout(timeout);
        calculateText.textContent = "Calculate Percentile";
        loadingSpinner.classList.add("hidden");
    }
});

if (document.getElementById("closeLimitModal")) {
    document.getElementById("closeLimitModal").addEventListener("click", () => {
        document.getElementById("limitModal").classList.remove("hidden"); 
    });
}

function startCountdown(resetAt) {
    const interval = setInterval(() => {
        const now = Date.now();
        const remaining = resetAt - now;

        if (remaining <= 0) {
            clearInterval(interval);
            document.getElementById("limitModal").classList.add("hidden");
            localStorage.removeItem("percentileRequests");
            return;
        }

        if (document.getElementById("timerDisplay")) {
            const hours = Math.floor(remaining / (1000 * 60 * 60));
            const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
            document.getElementById("timerDisplay").textContent = `Try again in: ${hours}h ${minutes}m ${seconds}s`;
        }
    }, 1000);
}


window.onload = function () {
    let requestData = JSON.parse(localStorage.getItem("percentileRequests")) || { count: 0, resetAt: null };
    const limitModal = document.getElementById("limitModal");
    const limitModalContent = limitModal ? limitModal.querySelector("div") : null;

    if (requestData.count >= 10 && Date.now() < requestData.resetAt) {
        if (limitModal) {
            limitModal.classList.remove("hidden");
            setTimeout(() => {
                limitModalContent.classList.add("opacity-100", "scale-100");
            }, 10);
            startCountdown(requestData.resetAt);
        }
    }
};

