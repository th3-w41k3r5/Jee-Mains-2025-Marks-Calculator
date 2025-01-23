async function fetchHtmlThroughProxy(url) {
    try {
        // Replace with your Vercel deployment URL
        const response = await fetch(`https://cors-proxy-psi-three.vercel.app/${encodeURIComponent(url)}`);
        
        // Check if the response was successful
        if (!response.ok) {
            throw new Error(`Failed to fetch HTML: ${response.statusText}`);
        }

        // Return the fetched HTML content
        return await response.text();
    } catch (error) {
        alert("Failed to fetch HTML through proxy: " + error.message);
        return null;
    }
}


const answerKeys = {
    "2024-01-27-shift-1": {
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
    },
    "2024-04-09-shift-2": {
        "68019114604": "68019156802",
        "68019114605": "68019156807",
        "68019114606": "68019156811",
        "68019114607": "68019156815",
        "68019114608": "68019156817",
        "68019114609": "68019156821",
        "68019114610": "68019156826",
        "68019114611": "68019156829",
        "68019114612": "68019156835",
        "68019114613": "68019156837",
        "68019114614": "68019156842",
        "68019114615": "68019156845",
        "68019114616": "68019156849",
        "68019114617": "68019156853",
        "68019114618": "68019156860",
        "68019114619": "68019156864",
        "68019114620": "68019156868",
        "68019114621": "68019156870",
        "68019114622": "68019156874",
        "68019114623": "68019156877",
        "68019114624": "24",
        "68019114625": "450",
        "68019114626": "70",
        "68019114627": "1011",
        "68019114628": "252",
        "68019114629": "61",
        "68019114630": "80",
        "68019114631": "36",
        "68019114632": "62",
        "68019114633": "0",
        "68019114634": "68019156892",
        "68019114635": "68019156896",
        "68019114636": "68019156900",
        "68019114637": "68019156903",
        "68019114638": "68019156907",
        "68019114639": "68019156913",
        "68019114640": "68019156915",
        "68019114641": "68019156922",
        "68019114642": "68019156925",
        "68019114643": "68019156930",
        "68019114644": "68019156931",
        "68019114645": "68019156935",
        "68019114646": "68019156942",
        "68019114647": "68019156943",
        "68019114648": "68019156947",
        "68019114649": "68019156953",
        "68019114650": "68019156955",
        "68019114651": "68019156962",
        "68019114652": "68019156964",
        "68019114653": "68019156969",
        "68019114654": "58",
        "68019114655": "4",
        "68019114656": "4",
        "68019114657": "28",
        "68019114658": "1027",
        "68019114659": "16",
        "68019114660": "22",
        "68019114661": "3",
        "68019114662": "150",
        "68019114663": "2500",
        "68019114664": "68019156983",
        "68019114665": "68019156987",
        "68019114666": "68019156989",
        "68019114667": "68019156994",
        "68019114668": "68019156999",
        "68019114669": "68019157002",
        "68019114670": "68019157007",
        "68019114671": "68019157009",
        "68019114672": "68019157013",
        "68019114673": "68019157019",
        "68019114674": "68019157023",
        "68019114675": "68019157025",
        "68019114676": "68019157029",
        "68019114677": "68019157034",
        "68019114678": "68019157038",
        "68019114679": "68019157041",
        "68019114680": "68019157048",
        "68019114681": "68019157051",
        "68019114682": "68019157056",
        "68019114683": "68019157058",
        "68019114684": "58",
        "68019114685": "6",
        "68019114686": "400",
        "68019114687": "23",
        "68019114688": "3",
        "68019114689": "6",
        "68019114690": "0",
        "68019114691": "15",
        "68019114692": "7",
        "68019114693": "4"
    },
    "2024-04-09-shift-2": {
        "68019114604": "68019156802",
        "68019114605": "68019156807",
        "68019114606": "68019156811",
        "68019114607": "68019156815",
        "68019114608": "68019156817",
        "68019114609": "68019156821",
        "68019114610": "68019156826",
        "68019114611": "68019156829",
        "68019114612": "68019156835",
        "68019114613": "68019156837",
        "68019114614": "68019156842",
        "68019114615": "68019156845",
        "68019114616": "68019156849",
        "68019114617": "68019156853",
        "68019114618": "68019156860",
        "68019114619": "68019156864",
        "68019114620": "68019156868",
        "68019114621": "68019156870",
        "68019114622": "68019156874",
        "68019114623": "68019156877",
        "68019114624": "24",
        "68019114625": "450",
        "68019114626": "70",
        "68019114627": "1011",
        "68019114628": "252",
        "68019114629": "61",
        "68019114630": "80",
        "68019114631": "36",
        "68019114632": "62",
        "68019114633": "0",
        "68019114634": "68019156892",
        "68019114635": "68019156896",
        "68019114636": "68019156900",
        "68019114637": "68019156903",
        "68019114638": "68019156907",
        "68019114639": "68019156913",
        "68019114640": "68019156915",
        "68019114641": "68019156922",
        "68019114642": "68019156925",
        "68019114643": "68019156930",
        "68019114644": "68019156931",
        "68019114645": "68019156935",
        "68019114646": "68019156942",
        "68019114647": "68019156943",
        "68019114648": "68019156947",
        "68019114649": "68019156953",
        "68019114650": "68019156955",
        "68019114651": "68019156962",
        "68019114652": "68019156964",
        "68019114653": "68019156969",
        "68019114654": "58",
        "68019114655": "4",
        "68019114656": "4",
        "68019114657": "28",
        "68019114658": "1027",
        "68019114659": "16",
        "68019114660": "22",
        "68019114661": "3",
        "68019114662": "150",
        "68019114663": "2500",
        "68019114664": "68019156983",
        "68019114665": "68019156987",
        "68019114666": "68019156989",
        "68019114667": "68019156994",
        "68019114668": "68019156999",
        "68019114669": "68019157002",
        "68019114670": "68019157007",
        "68019114671": "68019157009",
        "68019114672": "68019157013",
        "68019114673": "68019157019",
        "68019114674": "68019157023",
        "68019114675": "68019157025",
        "68019114676": "68019157029",
        "68019114677": "68019157034",
        "68019114678": "68019157038",
        "68019114679": "68019157041",
        "68019114680": "68019157048",
        "68019114681": "68019157051",
        "68019114682": "68019157056",
        "68019114683": "68019157058",
        "68019114684": "58",
        "68019114685": "6",
        "68019114686": "400",
        "68019114687": "23",
        "68019114688": "3",
        "68019114689": "6",
        "68019114690": "0",
        "68019114691": "15",
        "68019114692": "7",
        "68019114693": "4"
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