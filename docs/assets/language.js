// Curated, local translations. Progress keys, save IDs and input values never change.
import ui from '../data/en-ui.json' with {type:'json'};
import frlg from '../data/en-frlg.json?v=11' with {type:'json'};
import names from '../data/en-names.json' with {type:'json'};
export const dictionary={...ui,...frlg,...names};
const KEY='pokeguide:language';
let language='de';try{if(localStorage.getItem(KEY)==='en')language='en';}catch{}
export const getLanguage=()=>language;
export const englishName=text=>names[text]||text;
const originals=new WeakMap();
const ordered=Object.keys(dictionary).filter(k=>k&&dictionary[k]!==k).sort((a,b)=>b.length-a.length);
const escaped=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const expression=ordered.length?new RegExp(ordered.map(k=>(/^[\p{L}\p{N}]/u.test(k)?'(?<![\\p{L}\\p{N}])':'')+escaped(k)+(/[\p{L}\p{N}]$/u.test(k)?'(?![\\p{L}\\p{N}])':'')).join('|'),'gu'):null;
export function translate(text){
 const level=text.match(/^(.+) auf Level (\d+) bringen$/u);if(level)return 'Raise '+translate(level[1])+' to level '+level[2];
 const item=text.match(/^(.+) auf (.+) anwenden$/u);if(item)return 'Use '+translate(item[1])+' on '+translate(item[2]);
 if(dictionary[text])return dictionary[text];return expression?text.replace(expression,s=>dictionary[s]||s):text;}
const active=()=>language==='en'&&(['firered','leafgreen'].includes(document.documentElement.dataset.edition)||['#account','#games','#master',''].includes(location.hash));
function update(node,key,value,write){let records=originals.get(node);if(!records){records={};originals.set(node,records);}let r=records[key];if(!r||value!==r.output)r={original:value,output:value};const next=active()?translate(r.original):r.original;r.output=next;records[key]=r;if(next!==value)write(next);}
export function translatePage(){
 document.documentElement.lang=active()?'en':'de';
 const walk=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;
 while((node=walk.nextNode()))if(!node.parentElement?.closest('script,style,textarea,.account-email,[data-no-translate]'))update(node,'text',node.nodeValue,v=>node.nodeValue=v);
 for(const e of document.querySelectorAll('[aria-label],[placeholder],[title]'))for(const a of ['aria-label','placeholder','title'])if(e.hasAttribute(a))update(e,a,e.getAttribute(a),v=>e.setAttribute(a,v));
 update(document.querySelector('title'),'text',document.title,v=>{document.title=v;});
}
export function setLanguage(value){language=value==='en'?'en':'de';try{localStorage.setItem(KEY,language);}catch{}translatePage();window.dispatchEvent(new Event('pokeguide-language'));}
export function languageControl(el,button){const panel=el('section','setup-panel');panel.setAttribute('data-no-translate','');panel.append(el('h2','',language==='en'?'Language':'Sprache'),el('p','muted',language==='en'?'English guides: FireRed and LeafGreen.':'Englische Guides: Feuerrot und Blattgrün.'));const choices=el('div','game-choices');for(const [code,label]of [['de','Deutsch'],['en','English']]){const b=button(label,'game-choice'+(language===code?' selected':''),()=>setLanguage(code));b.setAttribute('aria-pressed',String(language===code));choices.append(b);}panel.append(choices);return panel;}
let scheduled=false;export function startLanguage(){new MutationObserver(()=>{if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;translatePage();});}).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','placeholder','title','data-edition']});window.addEventListener('hashchange',translatePage);window.addEventListener('storage',e=>{if(e.key===KEY){language=e.newValue==='en'?'en':'de';translatePage();}});translatePage();}
