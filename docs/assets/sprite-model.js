// Keep the original pixels. Both Kanto collections intentionally use FR/LG artwork.
export function spritePresentation(id,series){
 if(!Number.isInteger(id)||id<1||id>386)throw Error('Unknown species');
 if(series==='rby'||series==='frlg')return {className:'sprite-frlg',x:(id-1)%16/15*100,y:Math.floor((id-1)/16)/24*100};
 if(id>251){const i=id-252;return {className:'sprite-hoenn',x:i%16/15*100,y:Math.floor(i/16)/8*100};}
 const i=(id-1)%128;return {className:id>128?'sprite-second':'',x:i%16/15*100,y:Math.floor(i/16)/7*100};
}
