async function fetchHtmlThroughProxy(url) {
    try {
        const response = await fetch(`http://localhost:3000/fetch-html?url=${encodeURIComponent(url)}`);
        return await response.text();
    } catch (error) {
        alert("Failed to fetch HTML through proxy: " + error.message);
        return null;
    }
}

const answerKeys = {
    "2025-01-27-shift-1": {
        "533543377": "5335431363",
        "533543378": "5335431368",
        "533543379": "5335431370",
        "533543380": "5335431373",
        "533543381": "5335431377",
        "533543382": "5335431382",
        "533543383": "5335431386",
        "533543384": "5335431391",
        "533543385": "5335431396",
        "533543386": "5335431398",
        "533543387": "5335431403",
        "533543388": "5335431405",
        "533543389": "5335431411",
        "533543390": "5335431416",
        "533543391": "5335431420",
        "533543392": "5335431423",
        "533543393": "5335431426",
        "533543394": "5335431431",
        "533543395": "5335431434",
        "533543396": "5335431439",
        "533543397": "5",
        "533543398": "28",
        "533543399": "2890",
        "533543400": "9",
        "533543401": "202",
        "533543402": "119",
        "533543403": "29",
        "533543404": "5",
        "533543405": "12",
        "533543406": "48",
        "533543407": "5335431453",
        "533543408": "5335431457",
        "533543409": "5335431460",
        "533543410": "5335431465",
        "533543411": "5335431467",
        "533543412": "5335431471",
        "533543413": "5335431478",
        "533543414": "5335431480",
        "533543415": "5335431486",
        "533543416": "5335431489",
        "533543417": "5335431492",
        "533543418": "5335431497",
        "533543419": "5335431500",
        "533543420": "5335431503",
        "533543421": "5335431507",
        "533543422": "5335431512",
        "533543423": "5335431516",
        "533543424": "5335431522",
        "533543425": "5335431525",
        "533543426": "5335431529",
        "533543427": "673",
        "533543428": "16",
        "533543429": "2",
        "533543430": "12",
        "533543431": "3",
        "533543432": "400",
        "533543433": "160",
        "533543434": "2",
        "533543435": "31",
        "533543436": "236",
        "533543437": "5335431543",
        "533543438": "5335431545",
        "533543439": "5335431549",
        "533543440": "5335431555",
        "533543441": "5335431557",
        "533543442": "5335431561",
        "533543443": "5335431566",
        "533543444": "5335431570",
        "533543445": "5335431574",
        "533543446": "5335431580",
        "533543447": "5335431582",
        "533543448": "5335431586",
        "533543449": "5335431592",
        "533543450": "5335431595",
        "533543451": "5335431597",
        "533543452": "5335431603",
        "533543453": "5335431607",
        "533543454": "5335431611",
        "533543455": "5335431614",
        "533543456": "5335431618",
        "533543457": "8",
        "533543458": "16",
        "533543459": "6",
        "533543460": "1200",
        "533543461": "3",
        "533543462": "108",
        "533543463": "2",
        "533543464": "4",
        "533543465": "3",
        "533543466": "4"
    }
};

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
