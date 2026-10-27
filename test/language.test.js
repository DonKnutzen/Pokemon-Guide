import test from 'node:test';
import assert from 'node:assert/strict';
import {dictionary,translate,englishName} from '../docs/assets/language.js';
import {frlgData as data} from '../docs/data/frlg-data.js';
test('every FRLG route instruction, map label and special-source detail has an explicit English translation',()=>{
 for(const a of data.areas){assert(dictionary[a.name]||a.name.startsWith('Route ')||['Silph Co.','Sevault-Canyon'].includes(a.name),a.name);assert(dictionary[a.steps],a.id);}
 for(const m of Object.values(data.maps))assert(dictionary[m.name],m.id);
 for(const s of [...data.items,...data.specials])if(s.detail)assert(dictionary[s.detail],s.detail);
 for(const v of Object.values(data.rewardNotes))assert(dictionary[v],v);
});
test('official names, dynamic counters and evolution wording translate without changing IDs',()=>{
 assert.equal(englishName('Bisasam'),'Bulbasaur');assert.equal(translate('Blattgrün'),'LeafGreen');assert.equal(translate('Bisasam auf Level 16 bringen'),'Raise Bulbasaur to level 16');
 assert.equal(translate('5 von 8 Quellen offen · sichtbar, versteckt und von Personen'),'5 of 8 sources remaining · visible, hidden and NPC rewards');
 assert.equal(translate('route_24'),'route_24');assert.equal(translate('caught.frlg.25'),'caught.frlg.25');
});
