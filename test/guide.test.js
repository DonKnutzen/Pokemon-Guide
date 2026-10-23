import test from 'node:test';
import assert from 'node:assert/strict';
import { guide } from '../docs/data/gold-silver.js';
import { blankProgress, restoreProgress, visibleSteps, chapterProgress, totalProgress, toggleStep, nextChapter, searchChapters, mergeBackup } from '../docs/assets/model.js';

test('every published chapter has a unique identity, valid source pages and usable steps', () => {
  assert.equal(guide.chapters.length, 34);
  assert.equal(new Set(guide.chapters.map(chapter => chapter.id)).size, guide.chapters.length);
  const steps = guide.chapters.flatMap(chapter => chapter.steps);
  assert.equal(new Set(steps.map(step => step.id)).size, steps.length);
  for (const chapter of guide.chapters) {
    assert.ok(guide.regions.some(region => region.id === chapter.region));
    assert.ok(chapter.pages.length && chapter.pages.every(page => Number.isInteger(page) && page >= 1 && page <= 117));
    for (const edition of ['gold', 'silver']) assert.ok(visibleSteps(chapter, edition).length);
    for (const step of chapter.steps) {
      assert.ok(step.text.trim());
      if (step.editions) assert.ok(step.editions.length && step.editions.every(edition => ['gold', 'silver'].includes(edition)));
    }
  }
});

test('checking a Gold task does not change the Silver playthrough, including after reload', () => {
  const chapter = guide.chapters[0]; let state = blankProgress(guide);
  state = toggleStep(state, chapter, chapter.steps[0].id, true);
  state.edition = 'silver';
  assert.equal(chapterProgress(chapter, state).done, 0);
  const restored = restoreProgress(JSON.parse(JSON.stringify(state)), guide);
  assert.equal(totalProgress(guide, restored, 'gold').done, 1);
  assert.equal(totalProgress(guide, restored, 'silver').done, 0);
  restored.edition = 'gold';
  assert.equal(totalProgress(guide, toggleStep(restored, chapter, chapter.steps[0].id, false)).done, 0);
});

test('optional goals do not inflate story completion or prevent a completed story chapter', () => {
  let state = blankProgress(guide);
  const chapter = guide.chapters.find(chapter => chapter.id === 'viola');
  for (const step of chapter.steps.filter(step => !step.optional)) state = toggleStep(state, chapter, step.id, true);
  assert.equal(chapterProgress(chapter, state).complete, true);
  const baseline = totalProgress(guide, state).done;
  state = toggleStep(state, chapter, chapter.steps.find(step => step.optional).id, true);
  const extra = guide.chapters.find(chapter => chapter.optional);
  state = toggleStep(state, extra, extra.steps[0].id, true);
  assert.equal(totalProgress(guide, state).done, baseline);
  assert.equal(chapterProgress(extra, state).done, 1);
});

test('both editions can earn all 16 unique badges and finish the story', () => {
  for (const edition of ['gold', 'silver']) {
    let state = blankProgress(guide); state.edition = edition;
    for (const chapter of guide.chapters.filter(chapter => !chapter.optional)) {
      for (const step of visibleSteps(chapter, edition).filter(step => !step.optional)) state = toggleStep(state, chapter, step.id, true);
    }
    const total = totalProgress(guide, state);
    assert.equal(total.percent, 100);
    assert.equal(new Set(total.badges).size, 16);
    assert.equal(total.chapters, total.chapterTotal);
  }
});

test('version-specific wing rewards and catch order follow the selected edition', () => {
  const radio = guide.chapters.find(chapter => chapter.id === 'radioturm');
  assert.ok(visibleSteps(radio, 'gold').some(step => step.text.includes('Buntschwinge')));
  assert.ok(!visibleSteps(radio, 'gold').some(step => step.text.includes('Silberflügel')));
  assert.ok(visibleSteps(radio, 'silver').some(step => step.text.includes('Silberflügel')));
  const legends = guide.chapters.find(chapter => chapter.id === 'legendaere');
  for (const edition of ['gold', 'silver']) assert.equal(visibleSteps(legends, edition).length, 4);
});

test('restoring saved progress discards unknown, duplicate and wrong-edition IDs', () => {
  const saved = { version: 1, guideId: guide.id, edition: 'invalid', completed: { gold: ['start-clock', 'start-clock', 'unknown', 'radio-silverwing'], silver: ['radio-silverwing'] }, lastChapter: { gold: 'unknown' } };
  const restored = restoreProgress(saved, guide);
  assert.equal(restored.edition, 'gold');
  assert.deepEqual(restored.completed.gold, ['start-clock']);
  assert.deepEqual(restored.completed.silver, ['radio-silverwing']);
  assert.equal(restored.lastChapter.gold, guide.chapters[0].id);
});

test('backup imports merge valid progress without erasing the current playthrough', () => {
  const current = blankProgress(guide); current.completed.gold = ['start-clock'];
  const backup = blankProgress(guide); backup.completed.gold = ['start-gear', 'unknown']; backup.completed.silver = ['start-partner'];
  const merged = mergeBackup(current, backup, guide);
  assert.deepEqual(merged.completed.gold, ['start-clock', 'start-gear']);
  assert.deepEqual(merged.completed.silver, ['start-partner']);
  assert.throws(() => mergeBackup(current, { ...backup, guideId: 'other-game' }, guide));
  assert.throws(() => mergeBackup(current, { ...backup, completed: { gold: 'invalid', silver: [] } }, guide));
  assert.deepEqual(current.completed.gold, ['start-clock']);
});

test('search finds German and English names and handles diacritics', () => {
  assert.ok(searchChapters(guide, 'gold', 'Goldenrod').some(chapter => chapter.id === 'dukatia'));
  assert.ok(searchChapters(guide, 'gold', 'Pokemon Ei').some(chapter => chapter.id === 'mr-pokemon'));
  assert.ok(searchChapters(guide, 'silver', 'Silberflügel').some(chapter => chapter.id === 'radioturm'));
  assert.ok(!searchChapters(guide, 'gold', 'asdf-unfindable').length);
});

test('continue resumes a visited incomplete chapter and finds another after completion', () => {
  let state = blankProgress(guide); const chapter = guide.chapters.find(chapter => chapter.id === 'dukatia');
  state.lastChapter.gold = chapter.id;
  assert.equal(nextChapter(guide, state).id, chapter.id);
  for (const step of visibleSteps(chapter, 'gold').filter(step => !step.optional)) state = toggleStep(state, chapter, step.id, true);
  assert.equal(nextChapter(guide, state).id, guide.chapters[0].id);
});
