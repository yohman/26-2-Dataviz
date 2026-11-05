// A spatial composition, not a geographic or statistical distance measure.
export function hash(value) {
  let n=2166136261;
  for(const char of String(value)){n^=char.charCodeAt(0);n=Math.imul(n,16777619);}
  return (n>>>0)/4294967296;
}
export const WORLD={width:3600,height:2400};
export function themeCenters(keys,count) {
  const radius=Math.min(930,240+Math.sqrt(Math.max(0,count))*110);
  return Object.fromEntries(keys.map((key,i)=>{
    const angle=i/keys.length*Math.PI*2-Math.PI/2;
    return [key,{x:WORLD.width/2+Math.cos(angle)*radius,y:WORLD.height/2+Math.sin(angle)*radius*.64}];
  }));
}
export function voiceTarget(voice,centers,count,index=0) {
  if(count<4)return {x:WORLD.width/2+(index-(count-1)/2)*420,y:WORLD.height/2+(index%2)*75};
  const a=centers[voice.categories[0]],b=centers[voice.categories[1]]||a;
  if(!a)return {x:WORLD.width/2+(hash(voice.id)-.5)*1300,y:WORLD.height/2+(hash(voice.id+'y')-.5)*900};
  return {x:a.x*.74+b.x*.26+(hash(voice.id)-.5)*360,y:a.y*.74+b.y*.26+(hash(voice.id+'y')-.5)*260};
}
// Draw a sparse set of authentic shared-theme relationships, never inferred ones.
export function sharedThreads(nodes,neighbors=2) {
  const links=new Map();
  for(const a of nodes){
    const nearest=nodes.filter(b=>a.id!==b.id&&a.categories.some(c=>b.categories.includes(c)))
      .sort((b,c)=>Math.hypot(a.x-b.x,a.y-b.y)-Math.hypot(a.x-c.x,a.y-c.y)).slice(0,neighbors);
    for(const b of nearest){const key=[a.id,b.id].sort().join('|');links.set(key,{key,source:a,target:b});}
  }
  return [...links.values()];
}
