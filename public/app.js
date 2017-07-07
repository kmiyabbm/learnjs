'use strict';

let learnjs = {};

learnjs.problemView = function(problemNumber) {
  let title = 'Problem #' + problemNumber + ' Coming soon!';
  return $('<div class="problem-view">').text(title);
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
