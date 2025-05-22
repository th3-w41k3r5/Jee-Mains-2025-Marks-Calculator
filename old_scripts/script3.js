//few features added like filter, question modal, works for all sessions and all paper of JEE Main (v3) [ENABLED]
//menu, modal
document.addEventListener("DOMContentLoaded", () => {
    const initialModal = new bootstrap.Modal(document.getElementById("initialModal"));
    initialModal.show();

    const hamburgerMenu = document.getElementById("hamburgerMenu");
    const menuContent = document.getElementById("menuContent");
    const menuInfo = document.getElementById("menuInfo");

    hamburgerMenu.addEventListener("click", () => {
        if (menuContent.classList.contains("show")) {
            menuContent.classList.remove("show");
            setTimeout(() => {
                menuContent.style.display = "none";
            }, 200);
        } else {
            menuContent.style.display = "block";
            setTimeout(() => {
                menuContent.classList.add("show");
            }, 10);
        }
    });

    document.addEventListener("click", (event) => {
        if (!hamburgerMenu.contains(event.target) && !menuContent.contains(event.target)) {
            menuContent.classList.remove("show");
            setTimeout(() => {
                menuContent.style.display = "none";
            }, 200);
        }
    });

    menuInfo.addEventListener("click", (event) => {
        event.preventDefault();
        initialModal.show();
        menuContent.classList.remove("show");
        setTimeout(() => {
            menuContent.style.display = "none";
        }, 200);
    });

});


//document.getElementById("removeFile").addEventListener("click", () => {
   // const fileInput = document.getElementById("answerSheetFile");
    //fileInput.value = "";
//});


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

//Evaluate button
document.getElementById("evaluationForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const urlInput = document.getElementById("answerSheetUrl").value.trim();
    const fileInput = document.getElementById("answerSheetFile");
    const loadingSpinner = document.getElementById("loadingSpinner");
    const selectedExamDate = document.getElementById("examDate").value;
    let storageKey, htmlContent;

    //if (urlInput && fileInput.files.length > 0) {
        //alert("Please use only one input method: either upload a file or enter a URL.");
        //return;
    //}

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
    } else {
        alert("Please provide a URL.");
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
        if (urlInput) {
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
        const questionType = userAnswerDetails?.question_type || "MCQ";

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

            if (questionType === "SA") {  //Integer Type
                const normalizedUserAnswer = parseFloat(userAnswerId);
                const normalizedCorrectAnswers = correctAnswers.map(ans => parseFloat(ans));

                if (normalizedCorrectAnswers.includes(normalizedUserAnswer)) {
                    correctCount++;
                    subjectStats[subject].correct++;
                    status = "Correct";
                } else {
                    incorrectCount++;
                    subjectStats[subject].incorrect++;
                    status = "Incorrect";
                }
            } else {  //MCQs
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
        }

        results.push({
            questionId,
            questionImg,
            userAnswerId,
            userAnswerImg,
            correctAnswerId,
            correctAnswerImg,
            status,
            subject
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
        subjectStats,
        selectedExamDate: document.getElementById("examDate").value
    };
}


function capitalize(subject) {
    return subject.charAt(0).toUpperCase() + subject.slice(1);
}


function populateSubjects() {
    const subjectContainer = document.getElementById("subjectFilters");
    const subjects = new Set();
    const rows = document.querySelectorAll("#resultsTable tr");
    rows.forEach(row => {
        const subject = row.dataset.subject;
        if (subject) {
            subjects.add(subject);
        }
    });

    subjectContainer.innerHTML = "";

    if (subjects.size === 0) {
        subjectContainer.innerHTML = "<em>No subjects available</em>";
        return;
    }

    const subjectIcons = {
        "maths": "fas fa-calculator",
        "physics": "fas fa-bolt",
        "chemistry": "fas fa-flask",
        "aptitude": "fas fa-brain",
        "planning": "fas fa-map-marked-alt"
    };
    subjects.forEach(subject => {
        const capitalizedSubject = subject.charAt(0).toUpperCase() + subject.slice(1);
        const iconClass = subjectIcons[subject.toLowerCase()] || "fas fa-book";
        const div = document.createElement("div");
        div.innerHTML = `<label><input type="checkbox" class="subject-filter" data-subject="${subject}" checked><i class="${iconClass}"></i> ${capitalizedSubject}</label>`;
        subjectContainer.appendChild(div);
    });
}

//filter
document.addEventListener("DOMContentLoaded", function () {
    const filterButton = document.getElementById("filterButton");
    const filterDropdown = document.getElementById("filterDropdown");
    const resetFilter = document.getElementById("resetFilter");
    const resultsTable = document.getElementById("resultsTable");

    document.getElementById("filterButton").addEventListener("click", function () {
        const dropdown = document.getElementById("filterDropdown");
    
        if (dropdown.classList.contains("show")) {
            dropdown.classList.remove("show");
            setTimeout(() => {
                dropdown.style.display = "none";
            }, 200);
        } else {
            const rect = dropdown.getBoundingClientRect();
            dropdown.style.right = rect.right > window.innerWidth ? "0px" : "auto";
            dropdown.style.left = "-130px";
            dropdown.style.top = "50px";
            dropdown.style.display = "block";
            setTimeout(() => {
                dropdown.classList.add("show");
            }, 10);
        }
    });
       
    document.addEventListener("click", function (event) {
        if (!filterButton.contains(event.target) && !filterDropdown.contains(event.target)) {
            filterDropdown.classList.remove("show");
        }
    });

    document.getElementById("applyFilter").addEventListener("click", function () {
        const showCorrect = document.getElementById("filterCorrect").checked;
        const showIncorrect = document.getElementById("filterIncorrect").checked;
        const showUnattempted = document.getElementById("filterUnattempted").checked;
        const showDropped = document.getElementById("filterDropped").checked;

        const selectedSubjects = Array.from(document.querySelectorAll(".subject-filter:checked"))
             .map(checkbox => checkbox.dataset.subject);

        const rows = document.getElementById("resultsTable").querySelectorAll("tr");
        rows.forEach(row => {
            const isCorrect = row.classList.contains("table-success");
            const isIncorrect = row.classList.contains("table-danger");
            const isDropped = row.classList.contains("table-warning");
            const isUnattempted = !isCorrect && !isIncorrect && !isDropped;
            const subject = row.dataset.subject;
    
            const shouldShowByStatus =
                (showCorrect && isCorrect) ||
                (showIncorrect && isIncorrect) ||
                (showUnattempted && isUnattempted) ||
                (showDropped && isDropped);

            const shouldShowBySubject =
                selectedSubjects.length === 0 || selectedSubjects.includes(subject);
            
          if (shouldShowByStatus && shouldShowBySubject) {
             row.style.display = "";
          } else {
             row.style.display = "none";
          }  
        });
    
        document.getElementById("filterDropdown").classList.remove("show");
    });
    
    resetFilter.addEventListener("click", function () {
        document.querySelectorAll("#filterDropdown input[type='checkbox']").forEach(checkbox => {
            checkbox.checked = true;
        });

        resultsTable.querySelectorAll("tr").forEach(row => {
            row.style.display = "";
        });
    });

    function injectSubjectsAfterEvaluation(subjectStats) {
        populateSubjects(subjectStats);
    }

    window.injectSubjectsAfterEvaluation = injectSubjectsAfterEvaluation;
});


function displayResults({ results, correctCount, incorrectCount, droppedCount, attemptedCount, totalScore, subjectStats, selectedExamDate}) {
    const resultsTable = document.getElementById("resultsTable");
    const summarySection = document.getElementById("resultsSummary");
    const ExamDateSelected = selectedExamDate.split('-')[2] + 's' + selectedExamDate.split('-')[4];
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
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h3>Your Score: <span style="font-size: 1.7rem; font-weight: bold;">${totalScore}</span></h3>
            <h3><span style="font-size: 1.5rem;">${ExamDateSelected}</span></h3>
        </div>
        <table class="table table-bordered table-dark">
            <thead><tr>${tableHeaders}</tr></thead>
            <tbody>${tableRows}</tbody>
        </table>
    `;

    resultsTable.innerHTML = "";

    results.forEach(({ questionId, questionImg, correctAnswerId, correctAnswerImg, userAnswerId, userAnswerImg, subject, status }) => {
        const row = document.createElement("tr");
        row.className = status === 'Correct' ? 'table-success' : status === 'Incorrect' ? 'table-danger' : status === 'Dropped' ? 'table-warning' : '';

        row.dataset.subject = subject ? capitalize(subject) : "Unknown";
        row.dataset.questionId = questionId;
        row.dataset.questionImg = questionImg || "";
        row.dataset.userAnswerId = userAnswerId || "No Answer";  
        row.dataset.correctAnswerId = correctAnswerId || "N/A";  
        row.dataset.userAnswerImg = userAnswerImg || "";  
        row.dataset.correctAnswerImg = correctAnswerImg || "";  
        row.dataset.status = status;

        row.innerHTML = `
            <td>${questionId}<br><span style="font-size:0.8rem;">(Click To View)</span></td>
            <td>${userAnswerId || ''}<br>${userAnswerImg ? `<img src="${userAnswerImg}" style="width:50px;height:50px;cursor:pointer;">` : ''}</td>
            <td>${correctAnswerId || ''}<br>${correctAnswerImg ? `<img src="${correctAnswerImg}" style="width:50px;height:50px;cursor:pointer;">` : ''}</td>
            <td>${status}</td>
        `;

        row.addEventListener("click", function () {
            openQuestionModal(this.dataset);
        });

        resultsTable.appendChild(row);
    });

    document.getElementById("resultsSection").classList.remove("d-none");
    populateSubjects();
    const floatingReminder = document.getElementById("floatingReminder");
    const floatingReminderText = document.getElementById("floatingReminderText");

    const reminders = [
        "Click on any question row to view it completely.",
        "You can use the filter button to see Correct/Incorrect answers separately subject-wise.",
    ];

    const showReminder = (index) => {
        if (index < reminders.length) {
            const delay = index === 0 ? 2000 : 3000;

            setTimeout(() => {
                floatingReminderText.textContent = reminders[index];
                floatingReminder.classList.remove("hide");
                floatingReminder.classList.add("show", "show-up");

                const closeButton = floatingReminder.querySelector('.btn-close');
                const closeHandler = (event) => {
                    event.preventDefault();
                    floatingReminder.classList.remove("show", "show-up");
                    floatingReminder.classList.add("hide");
                    setTimeout(() => {
                        showReminder(index + 1);
                    }, 3000);
                    closeButton.removeEventListener('click', closeHandler);
                };
                if (closeButton) {
                    closeButton.addEventListener('click', closeHandler);
                }

            }, delay);
        } else {
            // setTimeout(() => {
            //     floatingReminder.classList.remove("show", "show-up");
            //     floatingReminder.classList.add("hide");
            // }, 2000);
        }
    };
    showReminder(0, 2000);
}


function openQuestionModal(data) {
    const modal = new bootstrap.Modal(document.getElementById("questionModal"));
    const subjectTitle = data.subject && data.subject !== "Unknown" ? capitalize(data.subject.trim()) : "Subject Not Available";
    document.getElementById("modalQuestionTitle").textContent = `${subjectTitle} - ${data.questionId}`;

    document.getElementById("modalYourAnswer").innerHTML = data.userAnswerImg 
        ? `<img src="${data.userAnswerImg}" class="option-img mw-100">` 
        : `<span class="answer-text">${data.userAnswerId}</span>`;

    document.getElementById("modalCorrectAnswer").innerHTML = data.correctAnswerImg 
        ? `<img src="${data.correctAnswerImg}" class="option-img mw-100">` 
        : `<span class="answer-text">${data.correctAnswerId}</span>`;

    const questionImage = document.getElementById("questionImage");
    questionImage.src = data.questionImg;
    questionImage.classList.toggle("d-none", !data.questionImg);

    const modalEvaluation = document.getElementById("modalEvaluation");
    modalEvaluation.textContent = `Status: ${data.status}`;
    modalEvaluation.className = `alert ${data.status === 'Correct' ? 'alert-success' : data.status === 'Incorrect' ? 'alert-danger' : 'alert-warning'}`;

    modal.show();
}


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

    const workerUrl = examDate.startsWith("2025-04")
        ? "https://score-worker2.iitjeepritam.workers.dev/"
        : "https://score-worker.iitjeepritam.workers.dev/";

    const proxyUrl = `https://cors-proxy.novadrone16.workers.dev?url=${encodeURIComponent(workerUrl)}`;

    try {
        const response = await fetch(proxyUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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
    const normalizedUrl = input.split('#')[0];
    return btoa(normalizedUrl); // Base64 encode for simplicity
}


async function hashFile(file) {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(byte => byte.toString(16).padStart(2, "0")).join("");
}


//session2 dates update
document.addEventListener("DOMContentLoaded", () => {
    const sessionSelect = document.getElementById("sessionSelect");
    const examDateSelect = document.getElementById("examDate");

    const januaryDates = [
        { value: "2025-01-22-shift-1", text: "22nd Jan, Shift 1" },
        { value: "2025-01-22-shift-2", text: "22nd Jan, Shift 2" },
        { value: "2025-01-23-shift-1", text: "23rd Jan, Shift 1" },
        { value: "2025-01-23-shift-2", text: "23rd Jan, Shift 2" },
        { value: "2025-01-24-shift-1", text: "24th Jan, Shift 1" },
        { value: "2025-01-24-shift-2", text: "24th Jan, Shift 2" },
        { value: "2025-01-28-shift-1", text: "28th Jan, Shift 1" },
        { value: "2025-01-28-shift-2", text: "28th Jan, Shift 2" },
        { value: "2025-01-29-shift-1", text: "29th Jan, Shift 1" },
        { value: "2025-01-29-shift-2", text: "29th Jan, Shift 2" },
        { value: "2025-01-30-shift-2", text: "30th Jan, Shift 2 (B.Arch+B.Planning)"}
    ];

    const aprilDates = [
        { value: "2025-04-02-shift-1", text: "2nd April, Shift 1" },
        { value: "2025-04-02-shift-2", text: "2nd April, Shift 2" },
        { value: "2025-04-03-shift-1", text: "3rd April, Shift 1" },
        { value: "2025-04-03-shift-2", text: "3rd April, Shift 2" },
        { value: "2025-04-04-shift-1", text: "4th April, Shift 1" },
        { value: "2025-04-04-shift-2", text: "4th April, Shift 2" },
        { value: "2025-04-07-shift-1", text: "7th April, Shift 1" },
        { value: "2025-04-07-shift-2", text: "7th April, Shift 2" },
        { value: "2025-04-08-shift-2", text: "8th April, Shift 2" },
        
    ];

    function updateExamDates() {
        const selectedSession = sessionSelect.value;
        const dates = selectedSession === "January" ? januaryDates : aprilDates;

        examDateSelect.innerHTML = "";
        dates.forEach(date => {
            const option = document.createElement("option");
            option.value = date.value;
            option.textContent = date.text;
            examDateSelect.appendChild(option);
        });
    }

    sessionSelect.addEventListener("change", updateExamDates);
    updateExamDates();
});

