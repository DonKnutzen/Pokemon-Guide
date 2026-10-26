// Catch status is shared within a series. Journey state always belongs to one edition.
export const series = [
 {id:'rby',name:'Rot · Blau · Gelb',region:'Kanto',generation:1,max:151,starters:[1,4,7],color:'#ae534a'},
 {id:'gsc',name:'Gold · Silber · Kristall',region:'Johto & Kanto',generation:2,max:251,starters:[152,155,158],color:'#b18a40'},
 {id:'rse',name:'Rubin · Saphir · Smaragd',region:'Hoenn',generation:3,max:386,starters:[252,255,258],color:'#478b75'},
 {id:'frlg',name:'Feuerrot · Blattgrün',region:'Kanto & Eiland',generation:3,max:386,starters:[1,4,7],color:'#8a754c'}
];
export const games = [
 {id:'red',name:'Rot',series:'rby',color:'#ba4b46'},
 {id:'blue',name:'Blau',series:'rby',color:'#567fb8'},
 {id:'yellow',name:'Gelb',series:'rby',color:'#bb9738'},
 {id:'gold',name:'Gold',series:'gsc',color:'#b18a40',guide:'gold-silver'},
 {id:'silver',name:'Silber',series:'gsc',color:'#8293a4',guide:'gold-silver'},
 {id:'crystal',name:'Kristall',series:'gsc',color:'#6697ab'},
 {id:'ruby',name:'Rubin',series:'rse',color:'#b75061'},
 {id:'sapphire',name:'Saphir',series:'rse',color:'#5d76b4'},
 {id:'emerald',name:'Smaragd',series:'rse',color:'#488c68'},
 {id:'firered',name:'Feuerrot',series:'frlg',color:'#bd7743',guide:'firered-leafgreen'},
 {id:'leafgreen',name:'Blattgrün',series:'frlg',color:'#73974c',guide:'firered-leafgreen'}
];
export const gameById = id => games.find(game=>game.id===id);
export const seriesById = id => series.find(row=>row.id===id);
