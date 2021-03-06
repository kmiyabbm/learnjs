'use strict';

let learnjs = {
  poolId: 'us-east-1:993b106d-53b6-4d4c-b751-4760f0ef382d'
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
  let answer =  view.find('.answer');

  function checkAnswer() {
    let def = $.Deferred();
    let test = problemData.code.replace('__', answer.val()) + '; problem();';
    let worker = new Worker('worker.js');
    worker.onmessage = function(e) {
      if (e.data) {
        def.resolve(e.data);
      } else {
        def.reject();
      }
    }
    worker.postMessage(test);

    return def;
  }

  function checkAnswerClick() {
    checkAnswer().done(function() {
      let flashContent = learnjs.buildCorrectFlash(problemNumber);
      learnjs.flashElement(resultFlash, flashContent);
      learnjs.saveAnswer(problemNumber, answer.val());
    }).fail(function() {
      learnjs.flashElement(resultFlash, 'Incorrect!');
    });
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

  learnjs.fetchAnswer(problemNumber).then(function(data) {
    if (data.Item) {
      answer.val(data.Item.answer);
    }
  });

  view.find('.check-btn').click(checkAnswerClick);
  view.find('.title').text('Problem #' + problemNumber);
  learnjs.applyObject(problemData, view);
  return view;
}

learnjs.showView = function(hash) {
  let routes = {
    '#problem': learnjs.problemView,
    '#profile': learnjs.profileView,
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
  learnjs.identity.done(learnjs.addProfileLink);
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

learnjs.profileView = function() {
  var view = learnjs.template('profile-view');
  learnjs.identity.done(function(identity) {
    view.find('.email').text(identity.email);
  });
  return view;
}

learnjs.addProfileLink = (profile) => {
  let link = learnjs.template('profile-link');
  link.find('a').text(profile.email);
  $('.signin-bar').prepend(link);
}

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
      let creds = AWS.config.credentials;
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

learnjs.sendDbRequest = function(req, retry) {
  var promise = new $.Deferred();
  req.on('error', function(error) {
    if (error.code === "CredentialsError") {
      learnjs.identity.then(function(identity) {
        return identity.refresh().then(function() {
          return retry();
        }, function() {
          promise.reject(resp);
        });
      });
    } else {
      promise.reject(error);
    }
  });
  req.on('success', function(resp) {
    promise.resolve(resp.data);
  });
  req.send();
  return promise;
}

learnjs.saveAnswer = function(problemId, answer) {
  return learnjs.identity.then(function(identity) {
    var db = new AWS.DynamoDB.DocumentClient();
    var item = {
      TableName: 'learnjs',
      Item: {
        userId: identity.id,
        problemId: problemId,
        answer: answer
      }
    };
    return learnjs.sendDbRequest(db.put(item), function() {
      return learnjs.saveAnswer(problemId, answer);
    })
  });
};

learnjs.fetchAnswer = function(problemId) {
  return learnjs.identity.then(function(identity) {
    var db = new AWS.DynamoDB.DocumentClient();
    var item = {
      TableName: 'learnjs',
      Key: {
        userId: identity.id,
        problemId: problemId
      }
    };
    return learnjs.sendDbRequest(db.get(item), function() {
      return learnjs.fetchAnswer(problemId);
    })
  });
};

learnjs.countAnswers = function(problemId) {
  return learnjs.identity.then(function(identity) {
    var db = new AWS.DynamoDB.DocumentClient();
    var params = {
      TableName: 'learnjs',
      Select: 'COUNT',
      FilterExpression: 'problemId = :problemId',
      ExpressionAttributeValues: {':problemId': problemId}
    };
    return learnjs.sendDbRequest(db.scan(params), function() {
      return learnjs.countAnswers(problemId);
    })
  });
};

learnjs.popularAnswers = function(problemId) {
  return learnjs.identity.then(function() {
    var lambda = new AWS.Lambda();
    var params = {
      FunctionName: 'learnjs_popularAnswers',
      Payload: JSON.stringify({problemNumber: problemId})
    };
    return learnjs.sendAwsRequest(lambda.invoke(params), function() {
      return learnjs.popularAnswers(problemId);
    });
  });
}