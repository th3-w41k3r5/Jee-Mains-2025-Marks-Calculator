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
        application_no: generalInfoRows[0]?.querySelectorAll('td')[1]?.textContent.trim() || "N/A",
        candidate_name: generalInfoRows[1]?.querySelectorAll('td')[1]?.textContent.trim() || "N/A",
        roll_no: generalInfoRows[2]?.querySelectorAll('td')[1]?.textContent.trim() || "N/A",
        test_date: generalInfoRows[3]?.querySelectorAll('td')[1]?.textContent.trim() || "N/A",
        test_time: generalInfoRows[4]?.querySelectorAll('td')[1]?.textContent.trim() || "N/A",
        subject: generalInfoRows[5]?.querySelectorAll('td')[1]?.textContent.trim() || "N/A",
    } : {};

    // Extract question details
    const questions = [];
    const questionPanels = doc.querySelectorAll('.question-pnl');

    questionPanels.forEach(panel => {
        // Extract the subject from the nearest .section-cntnr
        const sectionContainer = panel.closest('.section-cntnr');
        const sectionLabel = sectionContainer?.querySelector('.section-lbl .bold')?.textContent.trim();

        let subject = "unknown";
        if (sectionLabel?.includes("Mathematics")) {
            subject = "maths";
        } else if (sectionLabel?.includes("Physics")) {
            subject = "physics";
        } else if (sectionLabel?.includes("Chemistry")) {
            subject = "chemistry";
        }

        // Extract question image
        const questionImgTag = panel.querySelector('td.bold[valign="top"] img');
        const questionImg = questionImgTag ? new URL(questionImgTag.getAttribute('src'), 'https://cdn3.digialm.com').href : null;

        // Extract question ID and option details
        const menuTable = panel.querySelector('table.menu-tbl');
        const menuRows = menuTable ? menuTable.querySelectorAll('tr') : [];
        const questionId = menuRows.length > 1 ? menuRows[1]?.querySelectorAll('td')[1]?.textContent.trim() : null;

        // Skip this panel if questionId is not found
        if (!questionId) return;

        // Check for integer-based questions or multiple-choice questions
        const questionType = menuRows.length > 0 ? menuRows[0]?.querySelectorAll('td')[1]?.textContent.trim() : null;
        let givenAnswer = null;

        // Extract options and their IDs (for MCQs)
        const optionIds = {};
        const optionImages = {};

        if (questionType === "MCQ") {
            const optionRows = panel.querySelectorAll('td');
            optionRows.forEach(row => {
                const textContent = row.textContent.trim();
                if (textContent.startsWith("1.") || textContent.startsWith("2.") || textContent.startsWith("3.") || textContent.startsWith("4.")) {
                    const optionNumber = textContent[0]; // Extract the option number (e.g., "1", "2", etc.)
                    const imgTag = row.querySelector('img');
                    const optionImg = imgTag ? new URL(imgTag.getAttribute('src'), 'https://cdn3.digialm.com').href : null;
                    const optionId = menuRows.length >= 6 ? menuRows[parseInt(optionNumber) + 1]?.querySelectorAll('td')[1]?.textContent.trim() : null;

                    if (optionId) {
                        optionIds[optionNumber] = optionId; // Map option number to ID
                        optionImages[optionId] = optionImg; // Map option ID to its image
                    }
                }
            });

            // Extract chosen option and resolve it to the correct option ID
            const chosenOptionNumber = menuRows.length > 7 ? menuRows[7]?.querySelectorAll('td')[1]?.textContent.trim() : null;
            givenAnswer = chosenOptionNumber && optionIds[chosenOptionNumber] ? optionIds[chosenOptionNumber] : "No Answer";
        } else if (questionType === "SA") {
            const givenAnswerElement = panel.querySelector('td.bold[style="word-break: break-word;"]');
            givenAnswer = givenAnswerElement ? givenAnswerElement.textContent.trim() : "No Answer";
        }

        // Append question data to results
        questions.push({
            question_id: questionId,
            question_img: questionImg,
            options: optionIds,
            option_images: optionImages,
            given_answer: givenAnswer,
            question_type: questionType,
            subject // Include the subject in the question data
        });
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

    // Initialize stats for each subject
    const subjectStats = {
        physics: { attempted: 0, correct: 0, incorrect: 0 },
        chemistry: { attempted: 0, correct: 0, incorrect: 0 },
        maths: { attempted: 0, correct: 0, incorrect: 0 }
    };

    for (const [questionId, correctAnswerId] of Object.entries(answerKey)) {
        // Find the question details in userAnswers
        const userAnswerDetails = userAnswers.find(q => q.question_id === questionId);
        const userAnswerId = userAnswerDetails?.given_answer || "No Answer";
        const userAnswerImg = userAnswerDetails?.option_images[userAnswerId] || null;
        const correctAnswerImg = userAnswerDetails?.option_images[correctAnswerId] || null;
        const questionImg = userAnswerDetails?.question_img || null;

        let status = "Unattempted";
        const subject = userAnswerDetails?.subject || "unknown";

        // Ensure the subject exists in subjectStats
        if (!subjectStats[subject]) {
            subjectStats[subject] = { attempted: 0, correct: 0, incorrect: 0 };
        }

        if (userAnswerId !== "No Answer") {
            attemptedCount++;
            subjectStats[subject].attempted++;

            if (userAnswerId === correctAnswerId) {
                correctCount++;
                subjectStats[subject].correct++;
                status = "Correct";
            } else {
                incorrectCount++;
                subjectStats[subject].incorrect++;
                status = "Incorrect";
            }
        }

        // Push detailed result
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

    const totalScore = correctCount * 4 - incorrectCount * 1; // Scoring: +4 for correct, -1 for incorrect
    return {
        results,
        correctCount,
        incorrectCount,
        attemptedCount,
        totalQuestions: Object.keys(answerKey).length,
        totalScore,
        subjectStats
    };
}



function displayResults({ results, correctCount, incorrectCount, attemptedCount, totalQuestions, totalScore, subjectStats }) {
    const resultsTable = document.getElementById("resultsTable");
    const summarySection = document.getElementById("resultsSummary");

    // Update the summary section with overall stats and subject-wise breakdown
    summarySection.innerHTML = `
        <h3>Your Score: ${totalScore}</h3>
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

    // Clear previous table content
    resultsTable.innerHTML = "";

    // Populate the detailed question evaluation table
    results.forEach(({ questionId, questionImg, correctAnswerId, correctAnswerImg, userAnswerId, userAnswerImg, status }) => {
        const questionImgHTML = questionImg ? `<img src="${questionImg}" style="width:50px;height:50px;cursor:pointer;" onclick="window.open('${questionImg}', '_blank');">` : '';
        const correctImgHTML = correctAnswerImg ? `<img src="${correctAnswerImg}" style="width:50px;height:50px;cursor:pointer;" onclick="window.open('${correctAnswerImg}', '_blank');">` : '';
        const userImgHTML = userAnswerImg ? `<img src="${userAnswerImg}" style="width:50px;height:50px;cursor:pointer;" onclick="window.open('${userAnswerImg}', '_blank');">` : '';

        const row = `
            <tr class="${status === 'Correct' ? 'table-success' : status === 'Incorrect' ? 'table-danger' : ''}">
                <td>${questionId}<br>${questionImgHTML}</td>
                <td>${userAnswerId || ''}<br>${userImgHTML}</td>
                <td>${correctAnswerId || ''}<br>${correctImgHTML}</td>
                <td>${status}</td>
            </tr>`;
        resultsTable.innerHTML += row;
    });

    // Make the results section visible
    document.getElementById("resultsSection").classList.remove("d-none");
}


function getSubjectFromQuestionId(questionId, subject) {
    return subject; // Use the subject parsed from HTML
}

