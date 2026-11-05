// One open prompt. Missing classifications and ratings remain missing.
export function openTextEntry(value){
  if(typeof value!=='string')return null;
  const text=value.trim();
  if(!text||text.length>500)return null;
  return {headline:text.length>90?text.slice(0,89).trimEnd()+'…':text,
    detail:text.length>90?text:'',change:'',categories:[],reach:null,urgency:null};
}
