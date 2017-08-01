'use strict';

let learnjs = {
  PoolId: 'us-east-1:993b106d-53b6-4d4c-b751-4760f0ef382d'
};

learnjs.problems = [
  {
    description: 'What is truth?',
    code: 'function problem () { return __; }'
  },
  {
    description: 'Simple Math',
    code: 'function problem () { return 42 === 6 * __; }'
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
      let flashContent = learnjs.buildCorrectFlash(problemNumber);
      learnjs.flashElement(resultFlash, flashContent);
    } else {
      learnjs.flashElement(resultFlash, 'Incorrect!');
    }
    return false;
  }

  if (problemNumber < learnjs.problems.length) {
    var buttonItem = learnjs.template('skip-btn');
    buttonItem.find('a').attr('href', '#problem-' + (problemNumber + 1));
    $('.nav-list').append(buttonItem);
    view.bind('removingView', function() {
      buttonItem.remove();
    });
  }

  view.find('.check-btn').click(checkAnswerClick);
  view.find('.title').text('Problem #' + problemNumber);
  learnjs.applyObject(problemData, view);
  return view;
}

learnjs.showView = function(hash) {
  let routes = {
    '#problem': learnjs.problemView,
    '#': learnjs.landingView,
    '': learnjs.landingView
  };
  let hashParts = hash.split('-');
  let viewFn = routes[hashParts[0]];
  if (viewFn) {
    learnjs.triggerEvent('removingView', []);
    $('.view-container').empty().append(viewFn(hashParts[1]))
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

learnjs.template = (name) => {
  return $('.templates .' + name).clone();
};

learnjs.buildCorrectFlash = (problemNum) => {
  let correctFlash = learnjs.template('correct-flash');
  let link = correctFlash.find('a');
  if (problemNum < learnjs.problems.length) {
    link.attr('href', '#problem-' + (problemNum + 1));
  } else {
    link.attr('href', '');
    link.text('You are Finished!');
  }
  return correctFlash;
};

learnjs.landingView = () => {
  return learnjs.template('landing-view');
};

learnjs.triggerEvent = (name, args) => {
  $('.view-container>*').trigger(name, args);
};

learnjs.awsRefresh = function() {
  var deferred = new $.Deferred();
  AWS.config.credentials.refresh(function(err) {
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve(AWS.config.credentials.identityId);
    }
  });
  return deferred.promise();
}

learnjs.identity = new $.Deferred();

function googleSignIn(googleUser) {
  let id_token = googleUser.getAuthResponse().id_token;
  AWS.config.update({
    region: 'us-east-1',
    credentials: new AWS.CognitoIdentityCredentials({
      IdentityPoolId: learnjs.poolId,
      Logins: {
        'accounts.google.com': id_token
      }
    })
  })

  function refresh() {
    return gapi.auth2.getAuthInstance().signIn({
      prompt: 'login'
    }).then(function(usertUpdate) {
      let creds = awS.config.credentials;
      let newToken = usertUpdate.getAuthResponse().id_token;
      creds.params.Logins['accounts.google.com'] = newToken;
      return learnjs.awsRefresh();
    })
  }

  learnjs.awsRefresh().then(function(id) {
    learnjs.identity.resolve({
      id: id,
      email: googleUser.getBasicProfile().getEmail(),
      refresh: refresh
    });
  });
}