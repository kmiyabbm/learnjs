describe ('LearnJS', () => {
  it('can show a problem view', () => {
    learnjs.showView('#problem-1');
    expect($('.vewi-container .problem-view').length).toEqual(1);
  });
});