document.addEventListener("DOMContentLoaded", () => {
    const initialModal = new bootstrap.Modal(document.getElementById("initialModal"));

    initialModal.show();

    const infoButton = document.getElementById("infoButton");
    infoButton.addEventListener("click", () => {
        initialModal.show();
    });
});

document.getElementById("removeFile").addEventListener("click", () => {
    const fileInput = document.getElementById("answerSheetFile");
    fileInput.value = "";
});


async function fetchHtmlThroughProxy(url) {
    try {
        const response = await fetch(`https://cors-proxy.novadrone16.workers.dev?url=${encodeURIComponent(url)}`);
        return await response.text();
    } catch (error) {
        alert("Failed to fetch HTML through proxy: " + error.message);
        return null;
    }
}


async function fetchAnswerKeys() {
    try {
        if (typeof window.answerKeysVersion === "undefined") {
            throw new Error("Answer keys version is not defined in anskey.js");
        }
    } catch (error) {
        console.error("Error fetching answer keys:", error);
        alert("Failed to fetch answer keys: " + error.message);
    }
}


function parseAnswerSheetHTML(htmlContent) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");

    const generalInfoTable = doc.querySelector('table[style="width:500px"]');
    const generalInfoRows = generalInfoTable ? generalInfoTable.querySelectorAll('tr') : [];

    const generalInfo = generalInfoRows.length >= 6 ? {
        test_date: generalInfoRows[3]?.querySelectorAll('td')[1]?.textContent.trim() || "N/A",
        test_time: generalInfoRows[4]?.querySelectorAll('td')[1]?.textContent.trim() || "N/A",
        subject: generalInfoRows[5]?.querySelectorAll('td')[1]?.textContent.trim() || "N/A",
    } : {};

    const questions = [];
    const questionPanels = doc.querySelectorAll('.question-pnl');

    questionPanels.forEach(panel => {
        const sectionContainer = panel.closest('.section-cntnr');
        const sectionLabel = sectionContainer?.querySelector('.section-lbl .bold')?.textContent.trim();

        let subject = "unknown";
        if (sectionLabel?.includes("Mathematics")) {
            subject = "maths";
        } else if (sectionLabel?.includes("Physics")) {
            subject = "physics";
        } else if (sectionLabel?.includes("Chemistry")) {
            subject = "chemistry";
        } else if (sectionLabel?.includes("Aptitude Test")) {
            subject = "aptitude";
        } else if (sectionLabel?.includes("Planning")) {
            subject = "planning";
        }

        const questionImgTag = panel.querySelector('td.bold[valign="top"] img');
        const questionImg = questionImgTag ? new URL(questionImgTag.getAttribute('src'), 'https://cdn3.digialm.com').href : null;

        const menuTable = panel.querySelector('table.menu-tbl');
        const menuRows = menuTable ? menuTable.querySelectorAll('tr') : [];
        const questionId = menuRows.length > 1 ? menuRows[1]?.querySelectorAll('td')[1]?.textContent.trim() : null;

        if (!questionId) return;

        const questionType = menuRows.length > 0 ? menuRows[0]?.querySelectorAll('td')[1]?.textContent.trim() : null;
        let givenAnswer = null;

        const optionIds = {};
        const optionImages = {};

        if (questionType === "MCQ") {
            const optionRows = panel.querySelectorAll('td');
            optionRows.forEach(row => {
                const textContent = row.textContent.trim();
                if (textContent.startsWith("1.") || textContent.startsWith("2.") || textContent.startsWith("3.") || textContent.startsWith("4.")) {
                    const optionNumber = textContent[0];
                    const imgTag = row.querySelector('img');
                    const optionImg = imgTag ? new URL(imgTag.getAttribute('src'), 'https://cdn3.digialm.com').href : null;
                    const optionId = menuRows.length >= 6 ? menuRows[parseInt(optionNumber) + 1]?.querySelectorAll('td')[1]?.textContent.trim() : null;

                    if (optionId) {
                        optionIds[optionNumber] = optionId;
                        optionImages[optionId] = optionImg;
                    }
                }
            });

            const chosenOptionNumber = menuRows.length > 7 ? menuRows[7]?.querySelectorAll('td')[1]?.textContent.trim() : null;
            givenAnswer = chosenOptionNumber && optionIds[chosenOptionNumber] ? optionIds[chosenOptionNumber] : "No Answer";
        } else if (questionType === "SA") {
            const givenAnswerElement = panel.querySelector('td.bold[style="word-break: break-word;"]');
            givenAnswer = givenAnswerElement ? givenAnswerElement.textContent.trim() : "No Answer";
        }

        questions.push({
            question_id: questionId,
            question_img: questionImg,
            options: optionIds,
            option_images: optionImages,
            given_answer: givenAnswer,
            question_type: questionType,
            subject
        });
    });

    return {
        general_info: generalInfo,
        questions: questions
    };
}


document.getElementById("evaluationForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const urlInput = document.getElementById("answerSheetUrl").value.trim();
    const fileInput = document.getElementById("answerSheetFile");
    const loadingSpinner = document.getElementById("loadingSpinner");
    const selectedExamDate = document.getElementById("examDate").value;
    let storageKey, htmlContent;

    if (urlInput && fileInput.files.length > 0) {
        alert("Please use only one input method: either upload a file or enter a URL.");
        return;
    }

    if (typeof window.answerKeysVersion === "undefined") {
        alert("Answer keys version is not available. Please check anskey.js.");
        return;
    }

    if (urlInput) {
        if (!urlInput.startsWith("https://cdn3.digialm.com/")) {
            alert("Invalid URL. Only URLs starting with 'https://cdn3.digialm.com/' are allowed.");
            return;
        }
        storageKey = generateStorageKey(urlInput);
    } else if (fileInput.files.length) {
        const file = fileInput.files[0];
        if (!file.name.toLowerCase().endsWith(".html")) {
            alert("Invalid file. Only .html files are allowed.");
            return;
        }
        storageKey = await hashFile(file);
    } else {
        alert("Please provide a file or URL.");
        return;
    }

    // Checking Local Storage for Existing Data
    const cachedData = fetchFromLocalStorage(storageKey);
    if (cachedData) {
        if (cachedData.answerKeysVersion === window.answerKeysVersion) {
            displayResults(cachedData);
            return;
        } else {
            console.log("Answer keys have been updated. Recalculating results...");
        }
    }

    // processing new data if Not in local storage
    loadingSpinner.classList.remove("d-none");
    document.getElementById("resultsSection").classList.add("d-none");

    try {
        if (fileInput.files.length) {
            const file = fileInput.files[0];
            htmlContent = await file.text();
        } else if (urlInput) {
            htmlContent = await fetchHtmlThroughProxy(urlInput);
        }

        if (!htmlContent) {
            alert("Failed to fetch or upload HTML content.");
            return;
        }

        await fetchAnswerKeys();
        if (typeof answerKeys === "undefined") {
            alert("Answer keys could not be loaded. Please check your anskey.js file.");
            return;
        }

        const userAnswers = parseAnswerSheetHTML(htmlContent);
        const extractedDate = userAnswers.general_info.test_date;
        const extractedTime = userAnswers.general_info.test_time;

        const [day, month, year] = extractedDate.split("/");
        const normalizedDate = `${year}-${month}-${day}`;

        const shift = extractedTime.includes("9:00 AM") ? "shift-1" : "shift-2";

        const constructedExamDate = `${normalizedDate}-${shift}`;

        if (constructedExamDate !== selectedExamDate) {
            alert(`The selected exam date (${selectedExamDate}) does not match the response sheet's date (${constructedExamDate}). Please select the correct date.`);
            return;
        }

        const evaluationResult = evaluateAnswers(
            userAnswers.questions,
            answerKeys[selectedExamDate]
        );

        if (
            evaluationResult.correctCount === 0 &&
            evaluationResult.incorrectCount === 0 &&
            evaluationResult.attemptedCount === 0 &&
            evaluationResult.droppedCount === 0
        ) {
            alert("No valid data found for the selected exam date. Please check your input.");
            return;
        }

        const uniqueId = generateUniqueId();

        storeEvaluationData(uniqueId, selectedExamDate, evaluationResult.subjectStats, evaluationResult.totalScore);

        saveToLocalStorage(storageKey, { ...evaluationResult, selectedExamDate, answerKeysVersion });

        displayResults(evaluationResult);
    } catch (error) {
        console.error(error);
        alert("An error occurred. Please try again.");
    } finally {
        loadingSpinner.classList.add("d-none");
        document.getElementById("resultsSection").classList.remove("d-none");
    }
});



function evaluateAnswers(userAnswers, answerKey) {
    const results = [];
    let correctCount = 0, incorrectCount = 0, attemptedCount = 0, droppedCount = 0;

    const subjectStats = {
        physics: { attempted: 0, correct: 0, incorrect: 0, dropped: 0 },
        chemistry: { attempted: 0, correct: 0, incorrect: 0, dropped: 0 },
        maths: { attempted: 0, correct: 0, incorrect: 0, dropped: 0 }
    };

    for (const [questionId, correctAnswerId] of Object.entries(answerKey)) {
        const userAnswerDetails = userAnswers.find(q => q.question_id === questionId);
        const userAnswerId = userAnswerDetails?.given_answer || "No Answer";
        const userAnswerImg = userAnswerDetails?.option_images[userAnswerId] || null;
        const correctAnswerImg = userAnswerDetails?.option_images[correctAnswerId] || null;
        const questionImg = userAnswerDetails?.question_img || null;

        let status = "Unattempted";
        let subject = userAnswerDetails?.subject?.toLowerCase() || "unknown";

        if (!subjectStats[subject]) {
            subjectStats[subject] = { attempted: 0, correct: 0, incorrect: 0, dropped: 0 };
        }

        if (correctAnswerId === "Drop") {
            droppedCount++;
            subjectStats[subject].dropped++;
            status = "Dropped";
        } else if (userAnswerId !== "No Answer") {
            attemptedCount++;
            subjectStats[subject].attempted++;

            const correctAnswers = correctAnswerId.includes(",") ? correctAnswerId.split(",") : [correctAnswerId];
            if (correctAnswers.includes(userAnswerId)) {
                correctCount++;
                subjectStats[subject].correct++;
                status = "Correct";
            } else {
                incorrectCount++;
                subjectStats[subject].incorrect++;
                status = "Incorrect";
            }
        }

        results.push({
            questionId,
            questionImg,
            userAnswerId,
            userAnswerImg,
            correctAnswerId,
            correctAnswerImg,
            status
        });
    }

    const totalScore = (correctCount * 4) - (incorrectCount * 1) + (droppedCount * 4);

    return {
        results,
        correctCount,
        incorrectCount,
        droppedCount,
        attemptedCount,
        totalQuestions: Object.keys(answerKey).length,
        totalScore,
        subjectStats
    };
}

function capitalize(subject) {
    return subject.charAt(0).toUpperCase() + subject.slice(1);
}

function displayResults({ results, correctCount, incorrectCount, droppedCount, attemptedCount, totalScore, subjectStats }) {
    const resultsTable = document.getElementById("resultsTable");
    const summarySection = document.getElementById("resultsSummary");

    const subjects = Object.keys(subjectStats).filter(subject => subjectStats[subject].attempted > 0);

    let tableHeaders = `<th></th><th>Total</th>`;
    subjects.forEach(subject => {
        tableHeaders += `<th>${capitalize(subject.replace(/-/g, " & "))}</th>`;
    });

    let tableRows = `
        <tr><td>Attempted</td><td>${attemptedCount}</td>`;
    subjects.forEach(subject => {
        tableRows += `<td>${subjectStats[subject]?.attempted || 0}</td>`;
    });
    tableRows += `</tr>`;

    tableRows += `
        <tr><td>Correct</td><td>${correctCount}</td>`;
    subjects.forEach(subject => {
        tableRows += `<td>${subjectStats[subject]?.correct || 0}</td>`;
    });
    tableRows += `</tr>`;

    tableRows += `
        <tr><td>Incorrect</td><td>${incorrectCount}</td>`;
    subjects.forEach(subject => {
        tableRows += `<td>${subjectStats[subject]?.incorrect || 0}</td>`;
    });
    tableRows += `</tr>`;

    tableRows += `
        <tr><td>Dropped</td><td>${droppedCount}</td>`;
    subjects.forEach(subject => {
        tableRows += `<td>${subjectStats[subject]?.dropped || 0}</td>`;
    });
    tableRows += `</tr>`;

    tableRows += `
        <tr><td>Score</td><td>${totalScore}</td>`;
    subjects.forEach(subject => {
        tableRows += `<td>${(subjectStats[subject]?.correct || 0) * 4 - (subjectStats[subject]?.incorrect || 0) + (subjectStats[subject]?.dropped || 0) * 4}</td>`;
    });
    tableRows += `</tr>`;

    summarySection.innerHTML = `
        <h3>Your Score: ${totalScore}</h3>
        <table class="table table-bordered">
            <thead><tr>${tableHeaders}</tr></thead>
            <tbody>${tableRows}</tbody>
        </table>
    `;

    resultsTable.innerHTML = "";

    results.forEach(({ questionId, questionImg, correctAnswerId, correctAnswerImg, userAnswerId, userAnswerImg, status }) => {
        const questionImgHTML = questionImg ? `<img src="${questionImg}" style="width:50px;height:50px;cursor:pointer;" onclick="window.open('${questionImg}', '_blank');">` : '';
        const correctImgHTML = correctAnswerImg ? `<img src="${correctAnswerImg}" style="width:50px;height:50px;cursor:pointer;" onclick="window.open('${correctAnswerImg}', '_blank');">` : '';
        const userImgHTML = userAnswerImg ? `<img src="${userAnswerImg}" style="width:50px;height:50px;cursor:pointer;" onclick="window.open('${userAnswerImg}', '_blank');">` : '';

        const row = `
            <tr class="${status === 'Correct' ? 'table-success' : status === 'Incorrect' ? 'table-danger' : status === 'Dropped' ? 'table-warning' : ''}">
                <td>${questionId}<br>${questionImgHTML}</td>
                <td>${userAnswerId || ''}<br>${userImgHTML}</td>
                <td>${correctAnswerId || ''}<br>${correctImgHTML}</td>
                <td>${status}</td>
            </tr>`;
        resultsTable.innerHTML += row;
    });

    document.getElementById("resultsSection").classList.remove("d-none");
}


document.getElementById("toggleIncorrect").addEventListener("click", function () {
    const button = this;
    const resultsTable = document.getElementById("resultsTable");
    const rows = resultsTable.querySelectorAll("tr");

    if (button.textContent === "Show Only Incorrect Questions") {
        rows.forEach(row => {
            if (!row.classList.contains("table-danger")) {
                row.style.display = "none";
            }
        });
        button.textContent = "Show All Questions";
    } else {
        rows.forEach(row => {
            row.style.display = "";
        });
        button.textContent = "Show Only Incorrect Questions";
    }
});


function getSubjectFromQuestionId(questionId, subject) {
    return subject;
}

// storing JUST score data in cf db. May be will use it to determine estimated percentile if enough scores per shift is collected
async function storeEvaluationData(uniqueId, examDate, subjectStats, totalScore) {

    const isPCM = subjectStats.physics?.attempted > 0 || subjectStats.chemistry?.attempted > 0;
    const isMathsAptitude = subjectStats.maths?.attempted > 0 && subjectStats.aptitude?.attempted > 0;
    const isMathsAptitudePlanning = isMathsAptitude && subjectStats.planning?.attempted > 0;

    const payload = {
        id: uniqueId,
        examDate,
        scores: {
            physics: isPCM 
                ? (subjectStats.physics?.correct * 4 - subjectStats.physics?.incorrect + subjectStats.physics?.dropped * 4) 
                : "-",
    
            chemistry: isPCM 
                ? (subjectStats.chemistry?.correct * 4 - subjectStats.chemistry?.incorrect + subjectStats.chemistry?.dropped * 4) 
                : "-",
    
            maths: subjectStats.maths?.attempted > 0 
                ? (subjectStats.maths.correct * 4 - subjectStats.maths.incorrect + subjectStats.maths.dropped * 4) 
                : "-",
    
            aptitude: isMathsAptitude 
                ? (subjectStats.aptitude?.correct * 4 - subjectStats.aptitude?.incorrect + subjectStats.aptitude?.dropped * 4) 
                : "-",
    
            planning: isMathsAptitudePlanning 
                ? (subjectStats.planning?.correct * 4 - subjectStats.planning?.incorrect + subjectStats.planning?.dropped * 4) 
                : "-",
    
            totalScore,
        },
    };

    saveToLocalStorage(uniqueId, payload);

    try {
        const proxyUrl = `https://cors-proxy.novadrone16.workers.dev?url=${encodeURIComponent(
            "https://score-worker.iitjeepritam.workers.dev/"
        )}`;

        const response = await fetch(proxyUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`Failed to store score. HTTP status: ${response.status}`);
        }
    } catch (error) {
        console.error("Error storing evaluation score:", error.message);
    }
}

//giving unique id to each user
function generateUniqueId() {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, "");
    const time = now.toTimeString().slice(0, 8).replace(/:/g, "");
    const milliseconds = now.getMilliseconds().toString().padStart(3, "0");
    return `${date}-${time}-${milliseconds}`;
}


// storing data in local storage if user wants to see the data again, giving faster access
function saveToLocalStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function fetchFromLocalStorage(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

function generateStorageKey(input) {
    return btoa(input); // Base64 encode for simplicity
}

async function hashFile(file) {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(byte => byte.toString(16).padStart(2, "0")).join("");
}


//session2 - https://score-worker2.iitjeepritam.workers.dev/
