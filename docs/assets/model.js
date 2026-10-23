import { collectionData } from '../data/collection-data.js';
import { emptyCollection, restoreCollections, mergeCollections } from './collection-model.js';

export const editions = ['gold', 'silver'];

export function visibleSteps(chapter, edition) {
  return chapter.steps.filter(step => !step.editions || step.editions.includes(edition));
}

export function blankProgress(guide) {
  return { version: 1, guideId: guide.id, edition: 'gold', completed: { gold: [], silver: [] }, lastChapter: { gold: guide.chapters[0].id, silver: guide.chapters[0].id }, collection: {gold:emptyCollection(),silver:emptyCollection()} };
}

export function restoreProgress(value, guide) {
  const state = blankProgress(guide);
  if (!value || typeof value !== 'object' || value.version !== 1 || value.guideId !== guide.id) return state;
  if (editions.includes(value.edition)) state.edition = value.edition;
  state.collection = restoreCollections(value.collection, collectionData);
  for (const edition of editions) {
    const allowed = new Set(guide.chapters.flatMap(chapter => visibleSteps(chapter, edition)).map(step => step.id));
    if (Array.isArray(value.completed?.[edition])) state.completed[edition] = [...new Set(value.completed[edition].filter(id => typeof id === 'string' && allowed.has(id)))];
    if (guide.chapters.some(chapter => chapter.id === value.lastChapter?.[edition])) state.lastChapter[edition] = value.lastChapter[edition];
  }
  return state;
}

export function chapterProgress(chapter, state, edition = state.edition) {
  const steps = visibleSteps(chapter, edition);
  const main = chapter.optional ? steps : steps.filter(step => !step.optional);
  const completed = new Set(state.completed[edition]);
  const done = main.filter(step => completed.has(step.id)).length;
  return { done, total: main.length, complete: main.length > 0 && done === main.length };
}

export function totalProgress(guide, state, edition = state.edition) {
  const main = guide.chapters.filter(chapter => !chapter.optional);
  const counts = main.map(chapter => chapterProgress(chapter, state, edition));
  const done = counts.reduce((total, count) => total + count.done, 0);
  const total = counts.reduce((total, count) => total + count.total, 0);
  const checked = new Set(state.completed[edition]);
  const badges = guide.chapters.flatMap(chapter => visibleSteps(chapter, edition)).filter(step => step.badge && checked.has(step.id)).map(step => step.badge);
  return { done, total, percent: total ? Math.round(done / total * 100) : 0, chapters: counts.filter(count => count.complete).length, chapterTotal: main.length, badges };
}

export function toggleStep(state, chapter, stepId, checked) {
  if (!visibleSteps(chapter, state.edition).some(step => step.id === stepId)) return state;
  const steps = new Set(state.completed[state.edition]);
  if (checked) steps.add(stepId); else steps.delete(stepId);
  return { ...state, completed: { ...state.completed, [state.edition]: [...steps] } };
}

export function nextChapter(guide, state) {
  const recent = guide.chapters.find(chapter => chapter.id === state.lastChapter[state.edition]);
  if (recent && !recent.optional && !chapterProgress(recent, state).complete) return recent;
  return guide.chapters.find(chapter => !chapter.optional && !chapterProgress(chapter, state).complete) || guide.chapters.find(chapter => chapter.id === 'silberberg') || guide.chapters.at(-1);
}

export function normalize(text) {
  return String(text).toLocaleLowerCase('de').normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/ß/g, 'ss');
}

export function searchChapters(guide, edition, query) {
  const tokens = normalize(query).trim().split(/\s+/).filter(Boolean);
  return guide.chapters.filter(chapter => {
    const haystack = normalize([chapter.title, chapter.english, chapter.summary, ...chapter.tips, ...visibleSteps(chapter, edition).map(step => step.text)].join(' '));
    return tokens.every(token => haystack.includes(token));
  });
}

export function mergeBackup(current, value, guide) {
  if (!value || value.version !== 1 || value.guideId !== guide.id || !value.completed || !editions.every(edition => Array.isArray(value.completed[edition]) && value.completed[edition].every(id => typeof id === 'string'))) {
    throw new Error('Diese Datei ist keine passende PokéGuide-Sicherung für Gold und Silber.');
  }
  const backup = restoreProgress(value, guide);
  const merged = restoreProgress(current, guide);
  for (const edition of editions) merged.completed[edition] = [...new Set([...merged.completed[edition], ...backup.completed[edition]])];
  merged.collection = mergeCollections(current.collection,value.collection,collectionData);
  return merged;
}
