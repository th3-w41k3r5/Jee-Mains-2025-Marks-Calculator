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
        // Check if answerKeys is already defined to avoid duplicate injection
        if (typeof answerKeys !== 'undefined') {
            console.log("Answer keys already loaded.");
            return;
        }

        const response = await fetch('./anskey.js');
        if (!response.ok) {
            throw new Error('Failed to load answer keys');
        }

        const text = await response.text();
        const keysScript = document.createElement('script');
        keysScript.type = 'text/javascript';
        keysScript.text = text;
        document.head.appendChild(keysScript);

        // Wait until answerKeys is defined
        await new Promise((resolve, reject) => {
            const interval = setInterval(() => {
                if (typeof answerKeys !== 'undefined') {
                    clearInterval(interval);
                    resolve();
                }
            }, 100);
            setTimeout(() => {
                clearInterval(interval);
                reject(new Error("Timeout loading answer keys"));
            }, 5000);
        });

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
    const subjectStats = {
        physics: { attempted: 0, correct: 0, incorrect: 0 },
        chemistry: { attempted: 0, correct: 0, incorrect: 0 },
        maths: { attempted: 0, correct: 0, incorrect: 0 }
    };

    for (const [questionId, correctAnswer] of Object.entries(answerKey)) {
        const userAnswer = userAnswers.find(q => q.question_id === questionId)?.given_answer || "No Answer";
        let status = "Unattempted";
        const subject = getSubjectFromQuestionId(questionId); // Assumes a function mapping question ID to subject exists

        if (userAnswer !== "No Answer") {
            attemptedCount++;
            subjectStats[subject].attempted++;

            if (userAnswer === correctAnswer) {
                correctCount++;
                subjectStats[subject].correct++;
                status = "Correct";
            } else {
                incorrectCount++;
                subjectStats[subject].incorrect++;
                status = "Incorrect";
            }
        }

        results.push({ questionId, userAnswer, correctAnswer, status });
    }

    const totalScore = correctCount * 4 - incorrectCount * 1;
    return { results, correctCount, incorrectCount, attemptedCount, totalQuestions: Object.keys(answerKey).length, totalScore, subjectStats };
}

function displayResults({ results, correctCount, incorrectCount, attemptedCount, totalQuestions, totalScore, subjectStats }) {
    const resultsTable = document.getElementById("resultsTable");
    const summarySection = document.getElementById("resultsSummary");

    summarySection.innerHTML = `
        <h3>Your Score</h3>
        <table class="table table-bordered">
            <thead>
                <tr>
                    <th></th>
                    <th>Total</th>
                    <th>Physics</th>
                    <th>Chemistry</th>
                    <th>Maths</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Attempted</td>
                    <td>${attemptedCount}</td>
                    <td>${subjectStats.physics.attempted}</td>
                    <td>${subjectStats.chemistry.attempted}</td>
                    <td>${subjectStats.maths.attempted}</td>
                </tr>
                <tr>
                    <td>Correct</td>
                    <td>${correctCount}</td>
                    <td>${subjectStats.physics.correct}</td>
                    <td>${subjectStats.chemistry.correct}</td>
                    <td>${subjectStats.maths.correct}</td>
                </tr>
                <tr>
                    <td>Incorrect</td>
                    <td>${incorrectCount}</td>
                    <td>${subjectStats.physics.incorrect}</td>
                    <td>${subjectStats.chemistry.incorrect}</td>
                    <td>${subjectStats.maths.incorrect}</td>
                </tr>
                <tr>
                    <td>Score</td>
                    <td>${totalScore}</td>
                    <td>${subjectStats.physics.correct * 4 - subjectStats.physics.incorrect}</td>
                    <td>${subjectStats.chemistry.correct * 4 - subjectStats.chemistry.incorrect}</td>
                    <td>${subjectStats.maths.correct * 4 - subjectStats.maths.incorrect}</td>
                </tr>
            </tbody>
        </table>
    `;

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

    document.getElementById("resultsSection").classList.remove("d-none");
}

function getSubjectFromQuestionId(questionId) {
    // Dummy implementation for mapping question IDs to subjects
    if (questionId.startsWith("1")) return "physics";
    if (questionId.startsWith("2")) return "chemistry";
    return "maths";
}
