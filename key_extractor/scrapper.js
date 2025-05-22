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

//advanced version
(function() {
    const questionIdElements = document.querySelectorAll('td.bold');
    const questionIds = {};
  
    questionIdElements.forEach(element => {
      const prevSibling = element.previousElementSibling;
      if (prevSibling && prevSibling.textContent.trim() === 'Question ID :') {
        const questionId = element.textContent.trim();
        if (questionId) {
          questionIds[questionId] = "";
        }
      }
    });
  
    const output = JSON.stringify(questionIds, null, 4);
    console.log(output);
})();