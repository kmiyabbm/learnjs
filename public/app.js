'use strict';

let learnjs = {};

learnjs.problems = [
  {
    description: 'What is truth?',
    code: 'function problem () { return __; }'
  },
  {
    description: 'Simple Math',
    code: 'function problem () { return 43 === 6 * __; }'
  }
];

learnjs.problemView = function(data) {
  let problemNumber = parseInt(data, 10);
  let view = $('.templates .problem-view').clone();
  let problemData = learnjs.problems[problemNumber - 1];
  let resultFlash = view.find('.result');

  function checkAnswer() {
    let answer =  view.find('.answer').val();
    let test = problemData.code.replace('__', answer) + '; problem();';
    return eval(test);
  }

  function checkAnswerClick() {
    if (checkAnswer()) {
      learnjs.flashElement(resultFlash, 'Correct!');
    } else {
      learnjs.flashElement(resultFlash, 'Incorrect!');
    }
    return false;
  }

  view.find('.check-btn').click(checkAnswerClick);
  view.find('.title').text('Problem #' + problemNumber);
  learnjs.applyObject(problemData, view);
  return view;
}

learnjs.showView = function(hash) {
  let routes = {
    '#problem': learnjs.problemView
  };
  let hashParts = hash.split('-');
  let viewFn = routes[hashParts[0]];
  if (viewFn) {
    $('.view-container').empty().append(viewFn(hashParts[1]));
  }
}

learnjs.appOnReady = function() {
  window.onhashchange = () => {
    learnjs.showView(window.location.hash);
  };
  learnjs.showView(window.location.hash);
}

learnjs.applyObject = (obj, elem) => {
  for (let key in obj) {
    elem.find('[data-name="' + key + '"]').text(obj[key]);
  }
};

learnjs.flashElement = (elem, content) => {
  elem.fadeOut('fast', () => {
    elem.html(content);
    elem.fadeIn();
  });
};
