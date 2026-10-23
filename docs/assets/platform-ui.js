import {games,series,gameById,seriesById} from '../data/catalog.js';
import {speciesIndex} from '../data/species-index.js';
import {caughtIn,allCaught,catchRecord,markCaught,hasProgress,importLibrary} from './platform-model.js';
import {authError} from './cloud.js';

export function platformUI(ctx){
 const {el,button,link,icon,main,openSheet,smallSearch,normalize,notify}=ctx;
 const lib=()=>ctx.library(),selected=()=>gameById(lib().selectedEdition),group=()=>seriesById(selected().series);
 let filter='missing',query='',mode='login';
 const go=hash=>{if(location.hash===hash)ctx.render();else location.hash=hash;};
 function sprite(id){
  const index=id>251?id-252:(id-1)%128,s=el('span','sprite '+(id>251?'sprite-hoenn':id>128?'sprite-second':''));
  s.style.backgroundPosition=(index%16/15*100)+'% '+(Math.floor(index/16)/(id>251?8:7)*100)+'%';s.setAttribute('role','img');s.setAttribute('aria-label',speciesIndex[id-1].name);return s;
 }
 function title(eyebrow,heading,text){const h=el('header','page-header');h.append(el('div','eyebrow',eyebrow),el('h1','',heading));if(text)h.append(el('p','muted',text));main.append(h);}
 function progress(count,max,caption){const box=el('div','collection-progress');const line=el('div');line.append(el('strong','',count+' / '+max),el('span','',caption));const bar=el('progress');bar.max=max;bar.value=count;bar.setAttribute('aria-label',caption);box.append(line,bar);return box;}
 function status(){const s=ctx.cloudState();return !s.user?'Auf diesem Gerät':s.status==='syncing'?'Wird synchronisiert …':s.status==='synced'?'Synchronisiert':s.status==='error'?'Auf Gerät gespeichert · Sync ausstehend':'Auf Gerät gespeichert';}
 function home(){
  title('DEINE POKÉMON-SAMMLUNG','Eine Reise nach der anderen.','Vier Spielreihen. Ein Platz für deine Sammlung.');
  const overview=el('section','collection-overview');const text=el('div');text.append(el('span','eyebrow','ÜBER ALLE REIHEN'),el('strong','overview-number',allCaught(lib()).length+' / 386'),el('p','muted','verschiedene Arten gesammelt'));const mons=el('div','overview-sprites');for(const id of [25,133,151])mons.append(sprite(id));overview.append(text,mons,link('#master','Gesamt-Pokédex ansehen','text-button','ball'));main.append(overview);
  const current=selected(),resume=el('section','resume-journey');const r=el('div');r.append(el('small','',current.guide?'DEINE AKTUELLE REISE':'DEINE AKTUELLE SAMMLUNG'),el('strong','','Pokémon '+current.name),el('span','',current.guide?ctx.lastPlace():'Gemeinsamer Pokédex · '+group().name));resume.append(r,button(current.guide?'Weiterreisen':'Pokédex öffnen','primary',()=>go(current.guide?'#route/'+ctx.lastLocation():'#dex'),'arrow'));main.append(resume);
  const heading=el('div','collection-section-head');heading.append(el('h2','','Wähle deine Edition.'),link('#account',status(),'storage-status',ctx.cloudState().user?'cloud':'user'));main.append(heading);
  const grid=el('div','series-grid');
  for(const s of series){
   const card=el('section','series-card');card.style.setProperty('--series-color',s.color);const top=el('div','series-card-head');top.append(el('span','eyebrow','GENERATION '+s.generation),el('span','region-tag',s.region));card.append(top,el('h2','',s.name));
   const starters=el('div','series-starters');for(const id of s.starters)starters.append(sprite(id));card.append(starters,progress(caughtIn(lib(),s.id).length,s.max,'im gemeinsamen Pokédex'));
   const choices=el('div','game-choices');for(const game of games.filter(g=>g.series===s.id)){
    const b=button(game.name,'game-choice'+(lib().selectedEdition===game.id?' selected':'')+(game.guide?' guide-ready':''),()=>ctx.select(game.id),game.guide?'compass':undefined);b.style.setProperty('--game-color',game.color);b.setAttribute('aria-label',game.name+(game.guide?' · Guide öffnen':' · Sammlung öffnen'));if(lib().selectedEdition===game.id)b.setAttribute('aria-pressed','true');choices.append(b);
   }card.append(choices,el('p','guide-state',s.id==='gsc'?'Gold & Silber: Routen, Pokémon und Fundkarten':'Pokédex bereit · Routen- und Itemguide folgt'));
   const open=button('Gemeinsamen Pokédex öffnen','series-dex-link',()=>{const current=games.find(g=>g.id===lib().selectedEdition&&g.series===s.id)||games.find(g=>g.series===s.id);ctx.select(current.id,'dex');},'ball');card.append(open);grid.append(card);
  }main.append(grid,el('p','platform-footnote','Fänge gelten innerhalb einer Spielreihe gemeinsam. Route, Items und Ausrüstung gehören immer zur gewählten Edition. Jede Entwicklung zählt einzeln.'));
 }
 function unavailable(){
  title('POKÉMON '+selected().name.toUpperCase(),'Deine Sammlung ist bereit.','Der Routen- und Itemguide für '+selected().name+' ist noch in Vorbereitung.');
  const card=el('section','setup-panel');const row=el('div','series-starters');for(const id of group().starters)row.append(sprite(id));card.append(row,el('h2','',group().name),el('p','muted','Du kannst erhaltene Pokémon bereits im gemeinsamen Pokédex dieser Reihe speichern. Die einzelnen Fangorte und Fundkarten kommen mit dem Guide dazu.'),progress(caughtIn(lib(),group().id).length,group().max,'Arten gesammelt'),link('#dex','Gemeinsamen Pokédex öffnen','primary','ball'),link('#games','Alle Editionen','text-button','left'));main.append(card);
 }
 function dex(global=false){
  main.replaceChildren();
  const s=group(),caught=global?allCaught(lib()):caughtIn(lib(),s.id),max=global?386:s.max;
  title(global?'ALLE VIER SPIELREIHEN':'GEMEINSAM · '+s.name.toUpperCase(),global?'Deine ganze Sammlung.':'Dein Pokédex.',global?'Jede Art zählt hier einmal. In den Reihen sammelst du sie unabhängig voneinander.':s.id==='rby'?'151 Arten · gemeinsam für Rot, Blau und Gelb.':s.max===386?'Nationaler Pokédex · 386 Arten. Erhaltene Pokémon aus Tausch zählen ebenfalls.':'251 Arten · gemeinsam für Gold, Silber und Kristall.');
  main.append(progress(caught.length,max,global?'verschiedene Arten gesammelt':'Arten in dieser Reihe'));
  if(!global)main.append(link('#master','Gesamt-Pokédex ansehen','text-button','ball'));
  main.append(smallSearch('Pokémon oder Nummer suchen …',v=>{query=v;fill();},query));const filters=el('div','filter-pills');for(const [key,label]of [['missing','Fehlen noch'],['caught','Gesammelt'],['all','Alle '+max]]){const b=button(label,'filter-pill'+(filter===key?' active':''),()=>{filter=key;dex(global);});b.setAttribute('aria-pressed',String(filter===key));filters.append(b);}main.append(filters);
  const result=el('div','mon-grid dex-grid');main.append(result);
  function fill(){result.replaceChildren();const q=normalize(query),ids=new Set(global?allCaught(lib()):caughtIn(lib(),s.id));for(const sp of speciesIndex.filter(sp=>sp.id<=max)){
   const got=ids.has(sp.id);if(filter==='missing'&&got||filter==='caught'&&!got)continue;if(q&&!normalize(sp.name+' '+String(sp.id).padStart(3,'0')).includes(q))continue;
   const card=el('article','mon-card');card.append(el('div','dex-number','#'+String(sp.id).padStart(3,'0')));const b=button('','mon-open',()=>details(sp.id,global));b.append(sprite(sp.id),el('strong','mon-name',sp.name));b.setAttribute('aria-label',sp.name+' · Sammlungen ansehen');card.append(b);
   if(global){const count=series.filter(s=>caughtIn(lib(),s.id).includes(sp.id)).length;card.append(el('p','mon-method',count?'In '+count+' Spielreihe'+(count===1?'':'n')+' gesammelt':'Noch in keiner Reihe'),button('Sammlungen ansehen','global-mon-action',()=>details(sp.id,true),'arrow'));}
   else{const source=catchRecord(lib(),s.id,sp.id);card.append(el('p','mon-method',got&&source?.edition?'Erfasst in '+gameById(source.edition).name:'Fangorte folgen mit dem Guide'));const label=el('label','catch-control'+(got?' is-caught':'')),input=el('input');input.type='checkbox';input.checked=got;input.setAttribute('aria-label',sp.name+' in '+s.name+' erhalten');input.addEventListener('change',()=>{markCaught(lib(),selected().id,sp.id,input.checked);ctx.persistOnly();ctx.render();});label.append(input,el('span','catch-symbol',got?'✓':'+'),el('span','',got?'Im Pokédex':'Erhalten'));card.append(label);}
   result.append(card);
  }if(!result.children.length)result.append(el('p','notice','Keine passenden Pokémon.'));}
  fill();
 }
 function details(id,global){
  const sp=speciesIndex[id-1];openSheet(sp.name,body=>{
   const hero=el('div','species-hero');hero.append(sprite(id),el('span','dex-number','#'+String(id).padStart(3,'0')),el('h3','',sp.name));body.append(hero,el('p','muted','Markiere die Reihen, in denen du diese Art bereits erhalten hast. Entwicklungen werden einzeln gesammelt.'));
   for(const s of series){if(id>s.max)continue;const got=caughtIn(lib(),s.id).includes(id),label=el('label','setting-check'),input=el('input');input.type='checkbox';input.checked=got;input.setAttribute('aria-label',sp.name+' · '+s.name);input.addEventListener('change',()=>{const ed=selected().series===s.id?selected().id:games.find(g=>g.series===s.id).id;markCaught(lib(),ed,id,input.checked);ctx.persistOnly();ctx.render();});label.append(input,el('span','',s.name));body.append(label);}
   body.append(el('p','notice','Jede Reihe hat eine eigene Sammlung. Eine Markierung ändert den Pokédex dieser Reihe.'));
  });
 }
 function bag(){
  title('DEIN REISEGEPÄCK','Dein Stand bleibt bei dir.','Pokémon '+selected().name+' · '+group().name);
  const box=el('section','account-panel');box.append(el('h2','','Deine Sammlung sichern.'),el('p','muted','Fänge zählen gemeinsam in dieser Reihe. Der Routen- und Itemguide für diese Edition folgt noch.'),button('Sammlung herunterladen','primary',ctx.exportBackup,'download'),button('Sicherung laden','secondary',ctx.importBackup,'upload'),link('#account','Konto & Synchronisierung','text-button','user'),link('#games','Edition wechseln','text-button','games'));main.append(box);
 }
 function account(){
  main.replaceChildren();
  const info=ctx.cloudState();title('DEIN KONTO','Überall weiterreisen.','Deine Sammlung und alle Durchläufe an einem Platz.');
  const panel=el('section','account-panel');main.append(panel);
  if(!info.configured){panel.append(icon('cloud'),el('h2','','Anmeldung wird vorbereitet.'),el('p','muted','Die Konten sind noch nicht freigeschaltet. Bis dahin werden deine Fänge, Items und Reisen auf diesem Gerät gespeichert.'),link('#games','Lokal weitersammeln','primary','arrow'),button('Sammlung sichern','secondary',ctx.exportBackup,'download'));return;}
  if(info.loading){panel.append(el('p','muted','Anmeldung wird geladen …'));return;}
  if(!ctx.cloud()){panel.append(el('h2','','Verbindung gerade nicht verfügbar.'),el('p','muted','Deine Sammlung bleibt auf diesem Gerät gespeichert.'),button('Erneut verbinden','primary',()=>location.reload(),'cloud'));return;}
  if(info.user){
   panel.append(el('span','source-tag','DEIN TRAINERKONTO'),el('h2','account-email',info.user.email||'Angemeldet'),el('p','sync-status',status()));
   if(info.syncedAt)panel.append(el('p','muted','Zuletzt synchronisiert: '+new Date(info.syncedAt).toLocaleString('de-DE')));
   panel.append(button(info.status==='syncing'?'Wird synchronisiert …':'Jetzt synchronisieren','primary',()=>ctx.sync(),'cloud'));
   const guest=ctx.guest();if(hasProgress(guest)&&!lib().migrations.includes('guest-import')){
    const box=el('div','guest-import');box.append(el('h3','','Deine bisherige lokale Sammlung'),el('p','muted',allCaught(guest).length+' Arten auf diesem Gerät. Du kannst diese Fänge und den zugehörigen Reisefortschritt zu deinem Konto hinzufügen.'),button('Lokale Sammlung übernehmen','secondary',()=>{importLibrary(lib(),guest);lib().migrations.push('guest-import');ctx.persistOnly();ctx.render();notify('Lokale Sammlung zum Konto hinzugefügt.');},'upload'));panel.append(box);
   }
   panel.append(button('Sicherung herunterladen','secondary',ctx.exportBackup,'download'),button('Abmelden','text-button',async()=>{try{await ctx.signOut();}catch(e){notify(authError(e));}},'user'));
   if(info.recovery)passwordForm(panel);return;
  }
  panel.append(el('h2','',mode==='register'?'Trainerkonto anlegen':mode==='recover'?'Passwort zurücksetzen':'Willkommen zurück.'),el('p','muted','Mit deinem Konto kannst du auf Handy und PC an derselben Sammlung weitermachen. Dein lokaler Fortschritt wird erst auf Wunsch übernommen.'));
  const form=el('form','account-form');const email=inputField('E-Mail','email','email','email');form.append(email.label);let pass;
  if(mode!=='recover'){pass=inputField('Passwort','password','password',mode==='register'?'new-password':'current-password');pass.input.minLength=mode==='register'?10:1;if(mode==='register')pass.label.append(el('small','muted','Mindestens 10 Zeichen.'));form.append(pass.label);}
  const message=el('p','form-message');message.setAttribute('role','status');const submit=button(mode==='register'?'Konto erstellen':mode==='recover'?'Link anfordern':'Anmelden','primary full');submit.type='submit';form.append(submit,message);panel.append(form);
  form.addEventListener('submit',async e=>{e.preventDefault();submit.disabled=true;message.textContent='Einen Moment …';try{
   const cloud=ctx.cloud();if(!cloud)throw Error('Cloud unavailable');
   if(mode==='register'){const data=await cloud.signUp(email.input.value.trim(),pass.input.value);message.textContent=data.session?'Du bist angemeldet.':'Bitte bestätige deine E-Mail-Adresse über den Link in deinem Postfach.';pass.input.value='';}
   else if(mode==='recover'){await cloud.reset(email.input.value.trim());message.textContent='Falls ein Konto zu dieser Adresse existiert, erhältst du eine E-Mail mit weiteren Schritten.';}
   else await cloud.signIn(email.input.value.trim(),pass.input.value);
  }catch(error){message.textContent=authError(error);}finally{submit.disabled=false;}});
  for(const [key,label]of [['login','Ich habe schon ein Konto'],['register','Neues Konto erstellen'],['recover','Passwort vergessen?']])if(key!==mode)panel.append(button(label,'text-button',()=>{mode=key;account();}));
 }
 function inputField(text,name,type,autocomplete){const label=el('label','account-field',text),input=el('input');input.type=type;input.name=name;input.autocomplete=autocomplete;input.required=true;input.maxLength=type==='email'?254:128;label.append(input);return {label,input};}
 function passwordForm(panel){const form=el('form','account-form'),p=inputField('Neues Passwort','new-password','password','new-password');p.input.minLength=10;const b=button('Neues Passwort speichern','primary');b.type='submit';const msg=el('p','form-message');msg.setAttribute('role','status');form.append(p.label,b,msg);form.addEventListener('submit',async e=>{e.preventDefault();b.disabled=true;try{await ctx.cloud().updatePassword(p.input.value);ctx.recovered();p.input.value='';msg.textContent='Passwort gespeichert.';}catch(error){msg.textContent=authError(error);}finally{b.disabled=false;}});panel.append(form);}
 return {home,unavailable,dex,account,bag,sprite};
}
