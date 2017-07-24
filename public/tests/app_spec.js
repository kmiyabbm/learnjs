describe ('LearnJS', () => {
  it('can show a problem view', () => {
    learnjs.showView('#problem-1');
    expect($('.view-container .problem-view').length).toEqual(1);
  });
  it('shows the landing page view when there is no hash', () => {
    learnjs.showView('');
    expect($('.view-container .landing-view').length).toEqual(1);
  });
  it('passes the hash view parameter to the view function', () => {
    spyOn(learnjs, 'problemView');
    learnjs.showView('#problem-42');
    expect(learnjs.problemView).toHaveBeenCalledWith('42');
  });
  it('invokes the router when load', () => {
    spyOn(learnjs, 'showView');
    learnjs.appOnReady();
    expect(learnjs.showView).toHaveBeenCalledWith(window.location.hash);
  });
  it('subscribes to the hash change event', () => {
    learnjs.appOnReady();
    spyOn(learnjs, 'showView');
    $(window).trigger('hashchange');
    expect(learnjs.showView).toHaveBeenCalledWith(window.location.hash);
  });

  describe('problem view', () => {
    let view;
    beforeEach(function() {
      view = learnjs.problemView('1');
    });

    it('has a title that includes the problem number', () => {
      expect(view.find('.title').text()).toEqual('Problem #1');
    });
    it('shows the description', () => {
      expect(view.find('[data-name="description"]').text()).toEqual('What is truth?');
    });
    it('shows the problem code', () => {
      expect(view.find('[data-name="code"]').text()).toEqual('function problem () { return __; }');
    });

    describe('answer section', () => {
      var resultFlash;

      beforeEach(function() {
        spyOn(learnjs, 'flashElement');
        resultFlash = view.find('.result');
      });

      describe('when the answer is correct', function() {
        beforeEach(function() {
          view.find('.answer').val('true');
          view.find('.check-btn').click();
        });

        it('flashes the result', function() {
          var flashArgs = learnjs.flashElement.calls.argsFor(0);
          expect(flashArgs[0]).toEqual(resultFlash);
          expect(flashArgs[1].find('span').text()).toEqual('Correct!');
        });

        it('shows a link to the next problem', function() {
          var link = learnjs.flashElement.calls.argsFor(0)[1].find('a');
          expect(link.text()).toEqual('Next Problem');
          expect(link.attr('href')).toEqual('#problem-2');
        });
      });

      it('rejects an incorrect answer', () => {
        view.find('.answer').val('false');
        view.find('.check-btn').click();
        expect(learnjs.flashElement).toHaveBeenCalledWith(resultFlash, 'Incorrect!');
      });
    });
  });
});
