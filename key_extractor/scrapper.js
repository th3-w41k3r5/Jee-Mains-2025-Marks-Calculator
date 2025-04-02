(function() {
    let result = {};
    document.querySelectorAll("tbody tr").forEach(row => {
        let questionIdElement = row.querySelector("[id*='lbl_QuestionNo']");
        let optionIdElement = row.querySelector("[id*='lbl_RAnswer']");
        
        if (questionIdElement && optionIdElement) {
            let questionId = questionIdElement.textContent.trim();
            let optionId = optionIdElement.textContent.trim();
            if (questionId && optionId) {
                result[questionId] = optionId;
            }
        }
    });
    console.log(JSON.stringify(result, null, 4));
})();