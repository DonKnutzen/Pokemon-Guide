import { guide } from '../data/gold-silver.js';
import { blankProgress, restoreProgress, visibleSteps, chapterProgress, totalProgress, toggleStep, nextChapter, searchChapters, normalize, mergeBackup } from './model.js';

const STORAGE_KEY = 'pokeguide:progress:' + guide.id + ':v1';
const main = document.getElementById('main');
const search = document.getElementById('search');
let state = blankProgress(guide);
let route = { page: 'start' };

function node(tag, className = '', text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}
function link(href, className, text) {
  const el = node('a', className, text); el.href = href; return el;
}
function message(text) {
  const el = document.getElementById('status'); el.textContent = text; el.hidden = false;
}
function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); return true; }
  catch { message('Dein Browser kann den Fortschritt gerade nicht dauerhaft speichern. Nutze „Sicherung speichern“, bevor du diese Seite schließt.'); return false; }
}
try {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) state = restoreProgress(JSON.parse(saved), guide);
} catch { message('Der gespeicherte Fortschritt konnte nicht geladen werden. Du kannst eine Sicherung laden; neue Schritte bleiben für diese Sitzung verfügbar.'); }

function chapterHref(chapter) { return '#guide/' + encodeURIComponent(chapter.id); }
function regionFor(chapter) { return guide.regions.find(region => region.id === chapter.region); }
function indexOf(chapter) { return guide.chapters.indexOf(chapter); }
function numberOf(chapter) { return String(indexOf(chapter) + 1).padStart(2, '0'); }
function eyebrow(text) { return node('div', 'eyebrow', text); }
function heading(title, aside) {
  const row = node('div', 'section-heading'); row.append(node('h2', '', title));
  if (aside) row.append(node('span', '', aside)); return row;
}
function sourceNote(chapter) {
  const details = node('details', 'source-note');
  details.append(node('summary', '', 'Vorlage & Umfang dieses Guides'));
  details.append(node('p', '', guide.source.title + (chapter ? ' · PDF-Seiten ' + chapter.pages.join(', ') + '.' : '.')));
  details.append(node('p', '', guide.source.note)); return details;
}

function renderNavigation() {
  const nav = document.getElementById('chapter-navigation'); nav.replaceChildren();
  for (const region of guide.regions) {
    const group = node('div', 'nav-region');
    const title = node('div', 'nav-region-title'); const dot = node('span'); dot.setAttribute('aria-hidden', 'true');
    title.append(dot, document.createTextNode(region.label)); group.append(title);
    for (const chapter of guide.chapters.filter(chapter => chapter.region === region.id)) {
      const item = link(chapterHref(chapter), 'chapter-link'); item.dataset.chapterId = chapter.id;
      item.append(node('span', 'chapter-number', numberOf(chapter)), node('span', '', chapter.title), node('span', 'nav-count'));
      group.append(item);
    }
    nav.append(group);
  }
  refreshProgress();
}

function refreshProgress() {
  const total = totalProgress(guide, state);
  for (const el of document.querySelectorAll('[data-total-percent]')) el.textContent = total.percent + ' %';
  for (const el of document.querySelectorAll('[data-total-count]')) el.textContent = total.done + ' / ' + total.total + ' Schritte';
  document.getElementById('overall-progress').value = total.percent;
  for (const item of document.querySelectorAll('[data-chapter-id]')) {
    const chapter = guide.chapters.find(chapter => chapter.id === item.dataset.chapterId);
    const count = chapterProgress(chapter, state);
    item.classList.toggle('complete', count.complete);
    const current = route.page === 'guide' && route.id === chapter.id && !search.value.trim();
    if (current) item.setAttribute('aria-current', 'page'); else item.removeAttribute('aria-current');
    item.querySelector('.chapter-number').textContent = count.complete ? '✓' : numberOf(chapter);
    item.querySelector('.nav-count').textContent = count.done + '/' + count.total;
    item.setAttribute('aria-label', chapter.title + ', ' + count.done + ' von ' + count.total + ' Schritten' + (chapter.optional ? ', freiwilliger Abstecher' : ''));
  }
  const overview = document.querySelector('.overview-link');
  if (route.page === 'start' && !search.value.trim()) overview.setAttribute('aria-current', 'page'); else overview.removeAttribute('aria-current');
  if (route.page === 'guide') {
    const chapter = guide.chapters.find(chapter => chapter.id === route.id);
    if (chapter) {
      const count = chapterProgress(chapter, state);
      const label = main.querySelector('[data-current-count]'); if (label) label.textContent = count.done + ' / ' + count.total + ' erledigt';
      const bar = main.querySelector('[data-current-progress]'); if (bar) { bar.max = count.total; bar.value = count.done; }
      const complete = main.querySelector('.chapter-complete'); if (complete) complete.hidden = !count.complete;
    }
  }
}

function primaryButton(text, href) {
  const button = link(href, 'primary-button'); button.append(node('span', '', text), node('span', 'button-arrow', '→')); return button;
}
function renderOverview() {
  const total = totalProgress(guide, state), next = nextChapter(guide, state);
  const hero = node('section', 'hero'); const copy = node('div', 'hero-copy');
  copy.append(eyebrow('GOLD & SILBER · DEIN STORY-GUIDE'));
  const title = node('h1'); title.append(document.createTextNode('Der Weg ist das '), node('em', '', 'Abenteuer.')); copy.append(title);
  copy.append(node('p', '', 'Von deinem ersten Pokémon in Neuborkia bis zum Silberberg. Dein Reisebuch für Johto, Kanto und alles dazwischen.'));
  copy.append(primaryButton(total.done ? (total.percent === 100 ? 'Deine Reise ansehen' : 'Abenteuer fortsetzen') : 'Abenteuer beginnen', chapterHref(next)));
  copy.append(node('span', 'hero-footnote', 'ORIGINALSPIELE · KEIN KONTO NÖTIG · DEIN TEMPO'));
  const figure = node('figure', 'landscape-frame'); const landscape = node('img');
  landscape.src = './assets/landscape.svg'; landscape.alt = ''; landscape.width = 520; landscape.height = 340;
  const caption = node('figcaption'); const screen = node('span'); const live = node('span', 'live-dot'); screen.append(live, document.createTextNode('BEREIT FÜR DEN NÄCHSTEN SCHRITT'));
  caption.append(screen, node('span', '', 'GEN. II / 02')); figure.append(landscape, caption); hero.append(copy, figure); main.append(hero);

  const stats = node('div', 'stat-strip');
  for (const [value, label, hint] of [[total.percent + ' %', 'Deine Geschichte', total.done + ' von ' + total.total + ' Schritten'], [total.badges.length + '/16', 'Orden gesammelt', 'Johto & Kanto'], [total.chapters + '/' + total.chapterTotal, 'Kapitel abgeschlossen', 'Freiwillige Ziele zählen extra']]) {
    const stat = node('div', 'stat'), text = node('span'); text.append(node('b', '', label), document.createTextNode(hint)); stat.append(node('strong', '', value), text); stats.append(stat);
  }
  main.append(stats);
  const resume = node('section', 'continue-card'), resumeCopy = node('div');
  resumeCopy.append(eyebrow(total.percent === 100 ? 'DEINE HAUPTGESCHICHTE IST ABGESCHLOSSEN' : 'DEIN NÄCHSTER HALT'), node('h3', '', next.title), node('p', '', next.summary));
  const resumeLink = link(chapterHref(next), 'continue-link', '→'); resumeLink.setAttribute('aria-label', next.title + ' öffnen'); resume.append(resumeCopy, resumeLink); main.append(resume);

  main.append(heading('Deine Reiseroute', 'DREI ETAPPEN. EIN ABENTEUER.'));
  const regions = node('div', 'region-grid');
  for (const [index, region] of guide.regions.filter(region => region.id !== 'extras').entries()) {
    const chapters = guide.chapters.filter(chapter => chapter.region === region.id);
    const nextRegional = chapters.find(chapter => !chapterProgress(chapter, state).complete) || chapters[0];
    const card = link(chapterHref(nextRegional), 'region-card');
    card.append(node('span', 'region-no', '0' + (index + 1)), node('h3', '', region.label), node('p', '', region.subtitle));
    const bottom = node('div', 'region-card-bottom'); bottom.append(node('span', '', chapters.filter(chapter => chapterProgress(chapter, state).complete).length + '/' + chapters.length + ' Kapitel'), node('span', '', '↗')); card.append(bottom); regions.append(card);
  }
  main.append(regions);
  main.append(heading('Deine Ordensammlung', 'SCHRITT FÜR SCHRITT VERDIENT'));
  const badgesPanel = node('section', 'badges-panel'); const badgesTop = node('div', 'badges-top');
  badgesTop.append(node('h2', '', 'Ein Platz für jeden Meilenstein'), node('span', '', total.badges.length + ' VON 16 ORDEN')); badgesPanel.append(badgesTop);
  const badges = node('ul', 'badges');
  for (const [index, badge] of guide.badges.entries()) {
    const earned = total.badges.includes(badge.id), item = node('li', 'badge' + (earned ? ' earned' : ''));
    item.title = badge.name + ' · ' + badge.leader + ' · ' + (earned ? 'erhalten' : 'noch offen');
    const icon = node('span', 'badge-icon'); icon.setAttribute('aria-hidden', 'true'); icon.append(node('span', '', String(index + 1).padStart(2, '0')));
    item.append(icon, node('span', 'badge-name', badge.leader), node('span', 'sr-only', badge.name + ': ' + (earned ? 'erhalten' : 'noch offen'))); badges.append(item);
  }
  badgesPanel.append(badges); main.append(badgesPanel);
  const extras = link(chapterHref(guide.chapters.find(chapter => chapter.region === 'extras')), 'extra-link'); extras.append(node('span', '', 'Abseits des Weges: Ruinen, legendäre Pokémon & kleine Umwege'), node('span', '', '→')); main.append(extras);
  main.append(heading('Gut zu wissen, bevor du losziehst'));
  const basics = node('div', 'basics-grid');
  for (const basic of guide.basics) { const card = node('article', 'basic'); card.append(node('h3', '', basic.title), node('p', '', basic.text)); basics.append(card); }
  main.append(basics, sourceNote());
}

function makeChecklist(chapter, steps) {
  const list = node('div', 'checklist');
  for (const step of steps) {
    const label = node('label', 'task'), checkbox = node('input'); checkbox.type = 'checkbox'; checkbox.id = 'task-' + step.id;
    checkbox.checked = state.completed[state.edition].includes(step.id);
    const copy = node('span', 'task-copy'); copy.append(node('span', 'task-text', step.text));
    if (step.badge) copy.append(node('span', 'badge-chip', guide.badges.find(badge => badge.id === step.badge).name));
    label.append(checkbox, copy); list.append(label);
    checkbox.addEventListener('change', () => { state = toggleStep(state, chapter, step.id, checkbox.checked); persist(); refreshProgress(); });
  }
  return list;
}
function renderChapter(chapter) {
  const count = chapterProgress(chapter, state); const region = regionFor(chapter);
  const header = node('header', 'chapter-header');
  header.append(link('#start', 'back-link', '← Zur Reiseübersicht'), eyebrow(region.label + ' / ABSCHNITT ' + numberOf(chapter) + (chapter.optional ? ' · FREIWILLIG' : '')), node('h1', '', chapter.title), node('p', 'chapter-summary', chapter.summary), node('div', 'chapter-english', chapter.english));
  main.append(header);
  const progress = node('section', 'chapter-progress'); const row = node('div', 'row-between'); const value = node('strong'); value.dataset.currentCount = '';
  row.append(node('span', '', chapter.optional ? 'Dein freiwilliges Ziel' : 'Dein Fortschritt in diesem Abschnitt'), value);
  const bar = node('progress'); bar.dataset.currentProgress = ''; bar.setAttribute('aria-label', 'Fortschritt in ' + chapter.title); bar.max = count.total; bar.value = count.done;
  progress.append(row, bar, node('p', 'chapter-complete', '✓ Abschnitt erledigt. Bereit für den nächsten Schritt?')); main.append(progress);
  const steps = visibleSteps(chapter, state.edition);
  main.append(node('h2', 'checklist-title', 'Schritt für Schritt'), makeChecklist(chapter, steps.filter(step => !step.optional)));
  const optional = steps.filter(step => step.optional);
  if (optional.length) { const more = node('details', 'optional-tasks'); more.append(node('summary', '', 'Freiwillige Aufgaben (' + optional.length + ')'), makeChecklist(chapter, optional)); main.append(more); }
  if (chapter.tips.length) {
    const tips = node('details', 'tips-box'); const content = node('div', 'tips-content'); tips.append(node('summary', '', 'Tipps für diesen Abschnitt'));
    for (const text of chapter.tips) content.append(node('p', '', text)); tips.append(content); main.append(tips);
  }
  const bottom = node('nav', 'chapter-bottom'); bottom.setAttribute('aria-label', 'Zwischen Abschnitten wechseln');
  const index = indexOf(chapter), previous = guide.chapters[index - 1], next = guide.chapters[index + 1];
  bottom.append(link(previous ? chapterHref(previous) : '#start', 'back-link', previous ? '← Vorheriger Abschnitt' : '← Reiseübersicht'));
  if (next) { const nextLink = link(chapterHref(next), 'next-link'); nextLink.append(node('span', '', next.optional ? 'Freiwilliger Abstecher' : 'Nächster Abschnitt'), document.createTextNode(next.title + ' →')); bottom.append(nextLink); }
  else bottom.append(link('#start', 'next-link', 'Zur Reiseübersicht →'));
  main.append(bottom, sourceNote(chapter));
}

function renderSearch(query) {
  const matches = searchChapters(guide, state.edition, query);
  const head = node('header', 'search-header'); head.append(eyebrow('SUCHE IM GESAMTEN GUIDE'), node('h1', 'search-heading', 'Auf der Suche nach „' + query + '“'), node('p', '', matches.length + (matches.length === 1 ? ' passender Abschnitt' : ' passende Abschnitte') + ' · Deutsche und englische Namen werden durchsucht.')); main.append(head);
  const resultList = node('div', 'search-results');
  for (const chapter of matches) {
    const result = link(chapterHref(chapter), 'search-result'); result.dataset.searchResult = 'true';
    result.append(eyebrow(regionFor(chapter).label + ' · ABSCHNITT ' + numberOf(chapter)), node('h2', '', chapter.title), node('p', '', chapter.summary));
    const matchedStep = visibleSteps(chapter, state.edition).find(step => normalize(query).split(/\s+/).some(token => normalize(step.text).includes(token)));
    if (matchedStep) result.append(node('p', 'match-text', matchedStep.text)); resultList.append(result);
  }
  if (!matches.length) resultList.append(node('p', 'no-results', 'Hier ist noch keine passende Spur. Versuche einen kürzeren Begriff oder einen Ortsnamen wie „Dukatia“ oder „Goldenrod“.'));
  main.append(resultList);
  let count = document.getElementById('search-announcement');
  if (!count) { count = node('span', 'sr-only'); count.id = 'search-announcement'; count.setAttribute('role', 'status'); document.body.append(count); }
  count.textContent = matches.length + ' passende Abschnitte gefunden.';
}

function readRoute() {
  const hash = location.hash.slice(1);
  if (!hash || hash === 'start') return { page: 'start' };
  if (hash.startsWith('guide/')) {
    try { const id = decodeURIComponent(hash.slice(6)); if (guide.chapters.some(chapter => chapter.id === id)) return { page: 'guide', id }; }
    catch { /* An invalid URL is handled by returning to the overview. */ }
  }
  history.replaceState(null, '', location.pathname + location.search + '#start');
  message('Dieser Abschnitt wurde nicht gefunden. Hier geht es zurück zur Reiseübersicht.'); return { page: 'start' };
}
function render() {
  document.documentElement.dataset.edition = state.edition;
  for (const button of document.querySelectorAll('.edition[data-edition]')) button.setAttribute('aria-pressed', String(button.dataset.edition === state.edition));
  document.getElementById('edition-indicator').textContent = state.edition === 'gold' ? 'GOLD EDITION' : 'SILBER EDITION';
  main.replaceChildren();
  if (search.value.trim()) { renderSearch(search.value.trim()); document.title = 'Suche · PokéGuide'; }
  else if (route.page === 'guide') {
    const chapter = guide.chapters.find(chapter => chapter.id === route.id); renderChapter(chapter); document.title = chapter.title + ' · PokéGuide';
  } else { renderOverview(); document.title = 'PokéGuide · Gold & Silber'; }
  refreshProgress();
}

for (const button of document.querySelectorAll('.edition[data-edition]')) button.addEventListener('click', () => {
  state.edition = button.dataset.edition;
  if (route.page === 'guide') state.lastChapter[state.edition] = route.id;
  persist(); render();
});
search.addEventListener('input', render);
document.addEventListener('keydown', event => {
  if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) && !document.activeElement.isContentEditable) { event.preventDefault(); search.focus(); }
  if (event.key === 'Escape' && document.activeElement === search) { search.value = ''; render(); search.blur(); }
});
window.addEventListener('hashchange', () => {
  search.value = ''; route = readRoute();
  if (route.page === 'guide') { state.lastChapter[state.edition] = route.id; persist(); }
  render(); main.focus();
  if (matchMedia('(max-width: 850px)').matches) document.querySelector('.chapter-disclosure').open = false;
});
document.addEventListener('click', event => {
  const target = event.target.closest('a[href^="#"]');
  if (target?.getAttribute('href') === '#main') { event.preventDefault(); main.focus(); return; }
  if (target && target.getAttribute('href') === location.hash && search.value.trim()) {
    search.value = ''; render(); main.focus();
  }
});
document.getElementById('export-progress').addEventListener('click', () => {
  const data = JSON.stringify({ ...state, exportedAt: new Date().toISOString() }, null, 2);
  const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
  const anchor = link(url, '', ''); anchor.download = 'pokeguide-gold-silber-fortschritt.json'; document.body.append(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  message('Deine Fortschrittssicherung wurde zum Download bereitgestellt.');
});
const backupFile = document.getElementById('backup-file');
document.getElementById('import-progress').addEventListener('click', () => backupFile.click());
backupFile.addEventListener('change', async () => {
  const file = backupFile.files[0]; if (!file) return;
  try {
    if (file.size > 512 * 1024) throw new Error('Die Datei ist zu groß für eine Fortschrittssicherung.');
    let parsed; try { parsed = JSON.parse(await file.text()); } catch { throw new Error('Die Datei enthält kein gültiges JSON. Bitte wähle eine PokéGuide-Sicherung.'); }
    state = mergeBackup(state, parsed, guide);
    if (persist()) message('Sicherung geladen. Die gespeicherten Schritte wurden zu deinem Fortschritt hinzugefügt.');
    render();
  } catch (error) { message(error.message || 'Die Sicherung konnte nicht geladen werden.'); }
  finally { backupFile.value = ''; }
});

route = readRoute();
if (route.page === 'guide') { state.lastChapter[state.edition] = route.id; persist(); }
if (matchMedia('(max-width: 850px)').matches) document.querySelector('.chapter-disclosure').open = false;
renderNavigation(); render();
