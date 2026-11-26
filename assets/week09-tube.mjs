import {tubeStations,sampleRoutes} from './week09-tube-data.mjs?v=20261127';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tfl='https://api.tfl.gov.uk/Journey/JourneyResults/';
export const defaultTubePair=['940GZZLULSQ','940GZZLUCGN'];
const examples=Object.keys(sampleRoutes).map(key=>key.split('>'));
const stations=new Map(tubeStations.map(row=>[row[0],row]));
const defaultRoute={walk:{minutes:4},rail:{minutes:1},source:'default'};
const cache=new Map(Object.entries(sampleRoutes).map(([key,route])=>[key,{...route,source:'sample'}]));
const pairKey=(a,b)=>a+'>'+b;
cache.set(pairKey(...defaultTubePair),defaultRoute);

export function tubeBreakEven(walk,rail){
  if(!Number.isFinite(walk)||walk<=0||!Number.isFinite(rail)||rail<=0)return null;
  return walk-rail;
}

export function tubeJourney(payload,mode){
  const valid=(payload?.journeys??[]).filter(j=>Number.isFinite(j.duration)&&j.duration>0&&
    (mode==='walking'?j.legs?.length&&j.legs.every(l=>l.mode?.id==='walking'):j.legs?.some(l=>l.mode?.id==='tube')));
  const trip=valid.reduce((best,j)=>!best||j.duration<best.duration?j:best,null);
  if(!trip)return null;
  return {minutes:trip.duration,transfers:Math.max(0,trip.legs.filter(leg=>leg.mode?.id==='tube').length-1),paths:trip.legs.flatMap(leg=>{
    try{
      if(mode==='tube'&&leg.mode?.id!=='tube')return [];
      const points=JSON.parse(leg.path?.lineString).filter(p=>Array.isArray(p)&&Number.isFinite(p[0])&&Number.isFinite(p[1]));
      return points.length>1?[points]:[];
    }catch{return [];}
  })};
}

export function tubeUrls(from,to){
  const a=stations.get(from),b=stations.get(to);
  if(!a||!b||from===to)return null;
  const p=(left,right,mode)=>tfl+left+'/to/'+right+'?mode='+mode+'&time=1200';
  return [p(a.slice(2).join(','),b.slice(2).join(','),'walking'),p(from,to,'tube')];
}

const routeMessage=(x,ja)=>({
  loading:ja?'TfLで所要時間を検索中…':'Looking up both routes with TfL…',
  same:ja?'異なる駅を二つ選んでください。':'Choose two different stations.',
  service:ja?'TfLに接続できませんでした。もう一度お試しください。':'Couldn’t reach TfL. Try again or choose an example.',
  partial:ja?'TfLの結果がそろわず、比較できません。':'TfL didn’t return both routes for this pair.',
  none:ja?'この組み合わせの経路は見つかりませんでした。':'TfL didn’t return either route for this pair.',
})[x]??'';
const mins=(n,ja)=>n+(ja?'分':' min');

const raceSettings=route=>{
  const gap=tubeBreakEven(route?.walk?.minutes,route?.rail?.minutes);
  return {gap,initial:Math.max(0,gap??0),limit:Math.max(5,(gap??0)+2)};
};

export function tubeTimeline(route,ja,extra=raceSettings(route).initial){
  if(!route)return '';
  const w=route.walk?.minutes,r=route.rail?.minutes,{gap,limit}=raceSettings(route);
  const max=Math.max(w??0,(r??0)+(gap===null?0:limit),1);
  const x=n=>40+678*Math.max(0,n??0)/max;
  const has=n=>Number.isFinite(n);
  const minutes=n=>'≈ '+mins(n,ja);
  const walk=ja?'徒歩':'Walk';
  const rail=route.rail?.transfers?(ja?'地下鉄（乗換込み）':'Tube incl. transfers'):(ja?'地下鉄の乗車':'Tube ride');
  const empty=ja?'経路なし':'No route';
  const label=(text,px,py,cls,anchor='start')=>'<text x="'+px+'" y="'+py+'" text-anchor="'+anchor+'" class="'+cls+'">'+esc(text)+'</text>';
  const line=(from,to,y,cls)=>'<path d="M'+x(from)+' '+y+' H'+x(to)+'" class="'+cls+'"/>';
  const node=(at,y,cls)=>'<circle cx="'+x(at)+'" cy="'+y+'" r="10" class="'+cls+'"/>';
  const yWalk=113,yTube=235,tubeEnd=(r??0)+extra;
  const accessible=walk+': '+(has(w)?minutes(w):empty)+'. '+rail+': '+(has(r)?minutes(r):empty)+'. '+
    (gap===null?'':(ja?'入場・待ち・退場の想定：':'Assumed entry, wait and exit: ')+mins(extra,ja));
  const endMarker=has(w)?'<path d="M'+x(w)+' 43 V263" class="w9-tube-finish"/>'+
    label(ja?'徒歩の到着':'Walk finish',x(w),28,'w9-tube-finish-label','middle'):'';
  const split=gap!==null&&extra>0
    ?line(r,tubeEnd,yTube,'w9-tube-race-extra')+node(tubeEnd,yTube,'w9-tube-race-end'):'';
  const timeoutLabel=gap!==null&&x(tubeEnd)-x(r)>190
    ?label(ja?'入場・待ち・退場':'Entry + wait + exit',(x(tubeEnd)+x(r))/2,271,'w9-tube-extra-label','middle'):'';
  const graphic='<svg class="w9-tube-race" viewBox="0 0 760 290" role="img" aria-label="'+esc(accessible)+'">'+
    '<path d="M40 113 V235" class="w9-tube-start"/>'+endMarker+
    (has(w)?line(0,w,yWalk,'w9-tube-race-walk')+node(w,yWalk,'w9-tube-walk-node'):'')+
    (has(r)?line(0,r,yTube,'w9-tube-race-rail')+split+node(r,yTube,'w9-tube-rail-node'):'')+
    node(0,yWalk,'w9-tube-walk-node')+node(0,yTube,'w9-tube-rail-node')+
    label(walk+'  '+(has(w)?minutes(w):empty),40,84,'w9-tube-race-label w9-tube-walk-label')+
    label(rail+'  '+(has(r)?minutes(r):empty),40,205,'w9-tube-race-label w9-tube-rail-label')+
    timeoutLabel+'</svg>';
  const takeaway=gap>0
    ?'<div class="w9-tube-takeaway"><strong>≈ '+mins(gap,ja)+'</strong><span>'+(ja?'地下鉄が徒歩に並ぶまでの余裕':'to get in, wait and get out before walking wins')+'</span></div>'
    :gap!==null
      ?'<div class="w9-tube-takeaway w9-tube-takeaway--text"><strong>'+(ja?'徒歩が有利':'Walking has the edge')+'</strong><span>'+(ja?'入場や待ち時間を足す前でも、地下鉄は徒歩より速くない。':'The Tube is no faster even before adding time in the stations.')+'</span></div>'
      :'<div class="w9-tube-takeaway w9-tube-takeaway--text"><strong>'+(ja?'比較できません':'No comparison yet')+'</strong><span>'+routeMessage(w||r?'partial':'none',ja)+'</span></div>';
  return '<figure class="w9-tube-timeline">'+graphic+takeaway+'</figure>';
}

function raceOutcome(route,extra,ja){
  const gap=raceSettings(route).gap;
  if(gap===null)return '';
  const difference=gap-extra;
  return difference===0?(ja?'同時に到着':'Tie'):
    difference>0?(ja?'地下鉄が'+mins(difference,ja)+'早い':'Tube wins by '+mins(difference,ja)):
    (ja?'徒歩が'+mins(-difference,ja)+'早い':'Walk wins by '+mins(-difference,ja));
}

function tubeMap(route,from,to,ja,slide,tflLink){
  if(route?.source==='default'){
    return '<figure class="w9-geographic-map w9-tube-map"><img src="'+esc(slide.image)+'" alt="'+esc(slide.description[ja?'ja':'en'])+'" width="1040" height="900">'+
      '<svg viewBox="0 0 1040 900" aria-hidden="true">'+
      '<text class="w9-map-station" x="268" y="726">Leicester Square</text><text class="w9-map-station" x="1020" y="224" text-anchor="end">Covent Garden</text>'+
      '<text class="w9-map-road" x="340" y="584" transform="rotate(-30 340 584)">Cranbourn St</text><text class="w9-map-road" x="615" y="400" transform="rotate(-35 615 400)">Long Acre</text></svg>'+
      '<figcaption>'+(ja?'赤線：徒歩ルート例':'Red: example walking route')+' / <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap</a></figcaption></figure>';
  }
  const a=stations.get(from),b=stations.get(to);
  const routes=[...(route?.walk?.paths??[]).map(points=>['walk',points]),...(route?.rail?.paths??[]).map(points=>['rail',points])];
  if(!routes.length)return '<div class="w9-tube-map w9-tube-map--empty">'+(ja?'経路図はありません':'Route map unavailable')+'</div>';
  const p0=a.slice(2),p1=b.slice(2),latMean=(p0[0]+p1[0])/2,ratio=Math.cos(latMean*Math.PI/180);
  const raw=([lat,lon])=>[(lon-p0[1])*ratio,p0[0]-lat];
  const xy=[p0,p1,...routes.flatMap(([,p])=>p)].map(raw);
  const minX=Math.min(...xy.map(p=>p[0])),maxX=Math.max(...xy.map(p=>p[0]));
  const minY=Math.min(...xy.map(p=>p[1])),maxY=Math.max(...xy.map(p=>p[1]));
  const scale=Math.min(530/Math.max(.0003,maxX-minX),440/Math.max(.0003,maxY-minY));
  const project=p=>{const [x,y]=raw(p);return [380+(x-(maxX+minX)/2)*scale,325+(y-(maxY+minY)/2)*scale];};
  const trace=(points)=>points.map((p,i)=>(i?'L':'M')+project(p).map(v=>v.toFixed(1)).join(' ')).join(' ');
  const pins=[a,b].map(([id,name,lat,lon],i)=>{
    const [x,y]=project([lat,lon]);
    return '<circle class="w9-tube-map-pin" cx="'+x+'" cy="'+y+'" r="9"/><text class="w9-tube-map-name" x="'+x+'" y="'+(y+(i?38:-22))+'" text-anchor="'+(x<240?'start':x>520?'end':'middle')+'">'+esc(name)+'</text>';
  }).join('');
  return '<figure class="w9-tube-map w9-tube-map--trace"><svg viewBox="0 0 760 650" role="img" aria-label="'+esc(a[1]+' / '+b[1])+'">'+
    routes.map(([mode,points])=>'<path class="w9-tube-trace--'+mode+'" d="'+trace(points)+'"/>').join('')+pins+
    '</svg><figcaption><a href="'+esc(tflLink)+'" target="_blank" rel="noopener noreferrer">'+(ja?'TfLの経路図（街路なし）':'TfL route traces, without streets')+'</a></figcaption></figure>';
}

export function renderTubeSlide(slide,ja){
  const option=(chosen)=>tubeStations.map(([id,name])=>'<option value="'+id+'"'+(id===chosen?' selected':'')+'>'+esc(name)+'</option>').join('');
  return '<section class="w9-combined-route" data-tube-slide>'+
    '<header class="w9-tube-header"><div><p>'+(ja?'私たちの改訂案':'Our proposed redesign')+'</p><h1>'+(ja?'徒歩か、地下鉄か？':'Walk or Tube?')+'</h1></div>'+
    '<form class="w9-tube-form"><p>'+(ja?'地下鉄の駅を二つ選んで比較':'Compare any two Tube stations')+'</p><div>'+
    '<label><span>'+(ja?'出発':'From')+'</span><select name="from">'+option(defaultTubePair[0])+'</select></label>'+
    '<label><span>'+(ja?'到着':'To')+'</span><select name="to">'+option(defaultTubePair[1])+'</select></label>'+
    '<button type="submit">'+(ja?'比較':'Compare')+'</button></div></form></header>'+
    '<div class="w9-tube-body"><div data-tube-map>'+tubeMap(defaultRoute,...defaultTubePair,ja,slide)+'</div>'+
    '<div class="w9-tube-chart"><div class="w9-tube-status" data-tube-status role="status" hidden></div><div data-tube-chart>'+tubeTimeline(defaultRoute,ja)+'</div>'+
    '<div class="w9-tube-adjust" data-tube-adjust><label><span>'+(ja?'入場・待ち・退場の想定':'Assume time for entry + wait + exit')+'</span>'+
    '<input type="range" min="0" max="5" value="3" aria-valuetext="'+mins(3,ja)+'"></label>'+
    '<div><output data-tube-extra>'+mins(3,ja)+'</output> <span data-tube-outcome aria-live="polite">'+raceOutcome(defaultRoute,3,ja)+'</span></div></div>'+
    '<div class="w9-tube-bottom"><button type="button" data-tube-example>'+(ja?'別の駅で試す':'Try another pair')+' <span aria-hidden="true">↻</span></button>'+
    '<a data-tube-source href="'+esc(slide.sources[1].href)+'" target="_blank" rel="noopener noreferrer">'+(ja?'TfLの目安':'TfL estimates')+'</a></div></div></div></section>';
}

export function bindTubeSlide(root,slide,ja){
  if(!root)return;
  const form=root.querySelector('form'),map=root.querySelector('[data-tube-map]'),chart=root.querySelector('[data-tube-chart]');
  const from=form.elements.namedItem('from'),to=form.elements.namedItem('to');
  const status=root.querySelector('[data-tube-status]'),source=root.querySelector('[data-tube-source]');
  const adjust=root.querySelector('[data-tube-adjust]'),extra=adjust.querySelector('input');
  const readout=adjust.querySelector('[data-tube-extra]'),outcome=adjust.querySelector('[data-tube-outcome]');
  let current=defaultRoute;
  let request=0,controller,next=0;
  function message(text){status.textContent=text;status.hidden=!text;}
  function updateRace(){
    const value=Number(extra.value);
    chart.innerHTML=tubeTimeline(current,ja,value);
    extra.setAttribute('aria-valuetext',mins(value,ja));
    readout.textContent=mins(value,ja);
    outcome.textContent=raceOutcome(current,value,ja);
  }
  extra.addEventListener('input',updateRace);
  for(const event of ['pointerdown','touchstart','dblclick'])extra.addEventListener(event,e=>e.stopPropagation());
  function show(route,a,b){
    const link='https://api-portal.tfl.gov.uk/';
    current=route;
    const settings=raceSettings(route);
    adjust.hidden=settings.gap===null;
    extra.max=settings.limit;extra.value=settings.initial;
    updateRace();
    map.innerHTML=tubeMap(route,a,b,ja,slide,link);
    source.href=route.source==='default'?slide.sources[1].href:link;
    source.textContent=route.source==='default'?(ja?'TfLの目安':'TfL estimates'):(ja?'TfLの経路検索・ロンドン時間 正午':'TfL Journey Planner · noon London time');
    source.hidden=false;
    message('');
  }
  async function compare(a,b){
    const serial=++request;
    controller?.abort();
    adjust.hidden=true;
    const urls=tubeUrls(a,b);
    if(!urls){
      message(routeMessage('same',ja));chart.innerHTML='';source.hidden=true;
      map.innerHTML=tubeMap(null,a,b,ja,slide);
      return;
    }
    const key=pairKey(a,b);
    if(cache.has(key)){show(cache.get(key),a,b);return;}
    controller=new AbortController();
    const {signal}=controller;
    const timer=setTimeout(()=>controller.abort(),9000);
    message(routeMessage('loading',ja));
    chart.innerHTML='';
    map.innerHTML='<div class="w9-tube-map w9-tube-map--empty"><span>'+esc(stations.get(a)[1])+'<br>'+esc(stations.get(b)[1])+'</span></div>';
    source.hidden=true;
    try{
      const modes=['walking','tube'];
      const result=await Promise.allSettled(urls.map(async(url,i)=>{
        const res=await fetch(url,{signal});
        if(res.status===404)return null;
        if(!res.ok)throw new Error('TfL unavailable');
        return tubeJourney(await res.json(),modes[i]);
      }));
      if(serial!==request||!root.isConnected)return;
      if(result.every(x=>x.status==='rejected')){message(routeMessage('service',ja));return;}
      const route={walk:result[0].value??null,rail:result[1].value??null,source:'planner'};
      if(result.every(x=>x.status==='fulfilled'))cache.set(key,route);
      show(route,a,b);
      if(result.some(x=>x.status==='rejected'))message(routeMessage('service',ja));
    }finally{clearTimeout(timer);}
  }
  form.addEventListener('submit',e=>{e.preventDefault();compare(from.value,to.value);});
  root.querySelector('[data-tube-example]').addEventListener('click',()=>{
    const pair=[...examples,defaultTubePair][next++%(examples.length+1)];
    [from.value,to.value]=pair;
    compare(...pair);
  });
}
