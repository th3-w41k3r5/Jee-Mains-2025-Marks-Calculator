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
        const response = await fetch('./anskey.js');
        if (!response.ok) {
            throw new Error('Failed to load answer keys');
        }
        const text = await response.text();
        const keysScript = document.createElement('script');
        keysScript.type = 'text/javascript';
        keysScript.text = text;
        document.head.appendChild(keysScript);
    } catch (error) {
        console.error("Error fetching answer keys:", error);
        alert("Failed to fetch answer keys: " + error.message);
    }
}

function parseAnswerSheetHTML(htmlContent) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");

    // Extract general information
    const generalInfoTable = doc.querySelector('table[style="width:500px"]');
    const generalInfoRows = generalInfoTable ? generalInfoTable.querySelectorAll('tr') : [];

    const generalInfo = generalInfoRows.length >= 6 ? {
        application_no: generalInfoRows[0].querySelectorAll('td')[1].textContent.trim(),
        candidate_name: generalInfoRows[1].querySelectorAll('td')[1].textContent.trim(),
        roll_no: generalInfoRows[2].querySelectorAll('td')[1].textContent.trim(),
        test_date: generalInfoRows[3].querySelectorAll('td')[1].textContent.trim(),
        test_time: generalInfoRows[4].querySelectorAll('td')[1].textContent.trim(),
        subject: generalInfoRows[5].querySelectorAll('td')[1].textContent.trim(),
    } : {};

    // Extract question details
    const questions = [];
    const questionPanels = doc.querySelectorAll('.question-pnl');

    questionPanels.forEach(panel => {
        // Question image
        const questionImgTag = panel.querySelector('td.bold[valign="top"] img');
        const questionImg = questionImgTag ? questionImgTag.getAttribute('src') : null;

        // Question ID and Options
        const menuTable = panel.querySelector('table.menu-tbl');
        const menuRows = menuTable ? menuTable.querySelectorAll('tr') : [];
        const questionId = menuRows.length > 1 ? menuRows[1].querySelectorAll('td')[1].textContent.trim() : null;

        // Integer-based question handling
        const questionType = menuRows.length > 0 ? menuRows[0].querySelectorAll('td')[1].textContent.trim() : null;
        let givenAnswer = null;

        if (questionType === "SA") {
            const givenAnswerElement = panel.querySelector('td.bold[style="word-break: break-word;"]');
            givenAnswer = givenAnswerElement ? givenAnswerElement.textContent.trim() : "No Answer";
        } else {
            // Option-based question handling
            const optionIds = menuRows.length >= 6 ? {
                "1": menuRows[2].querySelectorAll('td')[1].textContent.trim(),
                "2": menuRows[3].querySelectorAll('td')[1].textContent.trim(),
                "3": menuRows[4].querySelectorAll('td')[1].textContent.trim(),
                "4": menuRows[5].querySelectorAll('td')[1].textContent.trim(),
            } : {};

            const chosenOptionNumber = menuRows.length > 7 ? menuRows[7].querySelectorAll('td')[1].textContent.trim() : null;
            givenAnswer = chosenOptionNumber && optionIds[chosenOptionNumber] ? optionIds[chosenOptionNumber] : "No Answer";
        }

        // Append question data
        if (questionId) {
            questions.push({
                question_id: questionId,
                question_img: questionImg,
                given_answer: givenAnswer,
                question_type: questionType
            });
        }
    });

    // Return extracted data
    return {
        general_info: generalInfo,
        questions: questions
    };
}

document.getElementById("evaluationForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const urlInput = document.getElementById("answerSheetUrl").value.trim();
    const fileInput = document.getElementById("answerSheetFile");
    let htmlContent = "";

    if (fileInput.files.length) {
        const file = fileInput.files[0];
        htmlContent = await file.text();
    } else if (urlInput) {
        htmlContent = await fetchHtmlThroughProxy(urlInput);
    } else {
        alert("Please provide a file or URL.");
        return;
    }

    if (!htmlContent) {
        alert("Failed to fetch or upload HTML content.");
        return;
    }

    await fetchAnswerKeys();

    if (typeof answerKeys === 'undefined') {
        alert("Answer keys could not be loaded. Please check your anskey.js file.");
        return;
    }

    const userAnswers = parseAnswerSheetHTML(htmlContent);
    const evaluationResult = evaluateAnswers(userAnswers.questions, answerKeys[document.getElementById("examDate").value]);
    displayResults(evaluationResult);
});

function evaluateAnswers(userAnswers, answerKey) {
    const results = [];
    let correctCount = 0, incorrectCount = 0, attemptedCount = 0;

    for (const [questionId, correctAnswer] of Object.entries(answerKey)) {
        const userAnswer = userAnswers.find(q => q.question_id === questionId)?.given_answer || "No Answer";
        let status = "Unattempted";

        if (userAnswer !== "No Answer") {
            attemptedCount++;
            if (userAnswer === correctAnswer) {
                correctCount++;
                status = "Correct";
            } else {
                incorrectCount++;
                status = "Incorrect";
            }
        }

        results.push({ questionId, userAnswer, correctAnswer, status });
    }

    const totalScore = correctCount * 4 - incorrectCount * 1;
    return { results, correctCount, incorrectCount, attemptedCount, totalQuestions: Object.keys(answerKey).length, totalScore };
}

function displayResults({ results, correctCount, incorrectCount, attemptedCount, totalQuestions, totalScore }) {
    const resultsTable = document.getElementById("resultsTable");
    const totalQuestionsEl = document.getElementById("totalQuestions");
    const attemptedQuestionsEl = document.getElementById("attemptedQuestions");
    const correctQuestionsEl = document.getElementById("correctQuestions");
    const incorrectQuestionsEl = document.getElementById("incorrectQuestions");
    const totalScoreEl = document.getElementById("totalScore");

    resultsTable.innerHTML = "";
    results.forEach(({ questionId, userAnswer, correctAnswer, status }) => {
        const row = `<tr class="${status === 'Correct' ? 'table-success' : status === 'Incorrect' ? 'table-danger' : ''}">
            <td>${questionId}</td>
            <td>${userAnswer}</td>
            <td>${correctAnswer}</td>
            <td>${status}</td>
        </tr>`;
        resultsTable.innerHTML += row;
    });

    totalQuestionsEl.textContent = totalQuestions;
    attemptedQuestionsEl.textContent = attemptedCount;
    correctQuestionsEl.textContent = correctCount;
    incorrectQuestionsEl.textContent = incorrectCount;
    totalScoreEl.textContent = totalScore;

    document.getElementById("resultsSection").classList.remove("d-none");
}
