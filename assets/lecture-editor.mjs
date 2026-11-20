import {renderWeek8,safeSlideImage} from './week08-visuals.mjs?v=authored-20261120';

export function moveSlide(slides,id,targetId,side){
 if(id===targetId)return slides;
 const moving=slides.find(s=>s.id===id);
 const next=slides.filter(s=>s.id!==id);
 const target=next.findIndex(s=>s.id===targetId);
 if(!moving||target<0)return slides;
 next.splice(target+(side==='after'?1:0),0,moving);
 return next.every((s,i)=>s===slides[i])?slides:next;
}

if(typeof document!=='undefined')start();

async function start(){
 const $=s=>document.querySelector(s), list=$('[data-edit-list]'), preview=$('[data-edit-preview]'),status=$('[data-edit-status]');
 const save=$('[data-edit-action=save]'), fields=[...document.querySelectorAll('[data-edit-field]')];
 const layout=$('[data-edit-layout]'),body=$('[data-edit-body]'),image=$('[data-edit-image]'),alt=$('[data-edit-alt]');
 let data,token,revision,slides=[],chosen,ja=true,dragId,dirty=false,saving=false,baseline='',undo=[];
 const blank=()=>({ja:'',en:''});
 const trace=rows=>rows.map(({id,sourceId,title,notes,content,image,steps,caption})=>({
  id,sourceId,title,notes,content:content??null,
  ...(image===undefined?{}:{image}),
  ...(caption?{caption}:{}),
  ...(steps?{steps:{ja:steps.ja.join('\n'),en:steps.en.join('\n')}}:{})
 }));
 const fingerprint=()=>JSON.stringify(trace(slides));
 const current=()=>slides.find(s=>s.id===chosen);
 const action=name=>$(`[data-edit-action="${name}"]`);
 const say=message=>{status.textContent=message;};
 const fit=el=>{const slide=el.firstElementChild;if(slide&&el.clientWidth)slide.style.transform=`scale(${el.clientWidth/1600})`;};
 const resize=new ResizeObserver(items=>items.forEach(({target})=>fit(target)));
 const snapshot=()=>{undo.push({slides:structuredClone(slides),chosen});if(undo.length>25)undo.shift();};
 const headings=s=>s.title[ja?'ja':'en'];
 const lang=()=>ja?'ja':'en';
 const languageLabel=()=>ja?'日本語':'English';
 function renderArt(container,s,isThumb=false){
  const art=container.firstElementChild||document.createElement('div');
  art.className=`html-slide slide-${s.kind}`;
  const renderSlide=s.image&&!safeSlideImage(s.image)?{...s,image:''}:s;
  art.innerHTML=renderWeek8(renderSlide,{ja,data,returnTo:'agenda.html#week-8'});
  if(isThumb){
   const suffix=`-${s.id}`;
   const ids=new Map([...art.querySelectorAll('[id]')].map(el=>[el.id,el.id+suffix]));
   art.querySelectorAll('[id]').forEach(el=>{el.id=ids.get(el.id);});
   art.querySelectorAll('[mask],[marker-end]').forEach(el=>{
    for(const attr of ['mask','marker-end']){
     const id=el.getAttribute(attr)?.match(/^url\(#(.+)\)$/)?.[1];
     if(ids.has(id))el.setAttribute(attr,`url(#${ids.get(id)})`);
    }
   });
   art.querySelectorAll('img').forEach(i=>i.loading='lazy');
   // Display-only copies: preserve the artwork but avoid nested controls inside the thumbnail button.
   art.querySelectorAll('a,button').forEach(el=>{
    const span=document.createElement('span');
    for(const key of ['class','style','data-replay','data-feedback','aria-pressed'])if(el.hasAttribute(key))span.setAttribute(key,el.getAttribute(key));
    span.append(...el.childNodes);el.replaceWith(span);
   });
  }
  if(!art.parentNode)container.append(art);
  fit(container);
 }
 function sync(){
  const i=slides.findIndex(s=>s.id===chosen);
  const s=current();
  dirty=fingerprint()!==baseline;
  save.disabled=!dirty||saving;
  action('up').disabled=saving||i<=0;
  action('down').disabled=saving||i>=slides.length-1;
  action('remove').disabled=saving||slides.length<=1;
  action('add').disabled=saving||slides.length>=200;
  action('duplicate').disabled=saving||slides.length>=200;
  action('undo').disabled=saving||!undo.length;
  for(const field of [...fields,layout,body,image,alt])field.disabled=saving;
  for(const code of ['ja','en'])action(code).setAttribute('aria-pressed',String(lang()===code));
  $('[data-edit-count]').textContent=`${slides.length} slides`;
  $('[data-edit-current]').textContent=`Slide ${i+1} / ${slides.length} · ${headings(s)}`;
  $('[data-edit-present]').href=`http://127.0.0.1:8767/lecture.html?week=8&slide=${encodeURIComponent(s.sourceId??slides[0].sourceId??'')}`;
 }
 function showContent(s){
  const c=s.content;
  layout.value=c?.layout??'original';
  layout.options[0].disabled=s.kind==='editable';
  const useSteps=!c&&s.steps, useCaption=!c&&s.caption, showImage=c?c.layout!=='type':Boolean(s.image);
  $('[data-for-body]').hidden=c?.layout==='figure'||!c&&!useSteps&&!useCaption;
  $('[data-for-image]').hidden=!showImage;
  $('[data-for-alt]').hidden=!c||!showImage;
  $('[data-edit-body-label]').textContent=`${useSteps?'Steps (one per line)':useCaption?'Caption':'On-slide text'} · ${languageLabel()}`;
  $('[data-edit-alt-label]').textContent=`Image description · ${languageLabel()}`;
  body.value=c?.body[lang()]??s.caption?.[lang()]??s.steps?.[lang()]?.join('\n')??'';
  image.value=(c?c.image:s.image)??'';
  alt.value=c?.alt[lang()]??'';
  $('[data-original-hint]').hidden=Boolean(c);
 }
 function setPanel(panel){
  for(const name of ['content','notes']){
   action(name+'-tab').setAttribute('aria-pressed',String(name===panel));
   $(`[data-edit-panel="${name}"]`).hidden=name!==panel;
  }
 }
 function showSelection({scroll=false}={}){
  const s=current();
  for(const field of fields){const [key,lang]=field.dataset.editField.split('.');field.value=s[key][lang];}
  showContent(s);
  for(const button of list.querySelectorAll('[data-slide-id]')){
   const selected=button.dataset.slideId===chosen;
   if(selected)button.setAttribute('aria-current','true');else button.removeAttribute('aria-current');
   if(selected&&scroll)button.scrollIntoView({block:'nearest',inline:'nearest'});
  }
  renderArt(preview,s);
  sync();
 }
 function renderList({scroll=false}={}){
  const top=list.scrollTop,left=list.scrollLeft;
  resize.disconnect();
  const rows=slides.map((s,i)=>{
   const li=document.createElement('li'),button=document.createElement('button'),thumb=document.createElement('div'),caption=document.createElement('span'),index=document.createElement('b'),label=document.createElement('span');
   button.type='button';button.className='editor-thumb';button.dataset.slideId=s.id;button.draggable=true;
   thumb.className='editor-artboard week8-deck';thumb.inert=true;thumb.setAttribute('aria-hidden','true');
   thumb.style.pointerEvents='none';
   caption.className='editor-thumb-caption';index.textContent=String(i+1).padStart(2,'0');label.textContent=headings(s);
   caption.append(index,label);button.append(thumb,caption);li.append(button);
   renderArt(thumb,s,true);resize.observe(thumb);
   return li;
  });
  list.replaceChildren(...rows);list.scrollTop=top;list.scrollLeft=left;
  resize.observe(preview);
  showSelection({scroll});
 }
 function change(next,message){
  if(next===slides)return;
  snapshot();slides=next;renderList({scroll:true});say(message||'Unsaved changes');
 }
 function clearDrop(){
  list.querySelectorAll('[data-drop]').forEach(el=>delete el.dataset.drop);
  list.querySelector('.is-dragging')?.classList.remove('is-dragging');
 }
 list.addEventListener('click',event=>{
  const button=event.target.closest('[data-slide-id]');
  if(button){chosen=button.dataset.slideId;showSelection();}
 });
 list.addEventListener('dragstart',event=>{
  const button=event.target.closest('[data-slide-id]');
  if(!button||saving){event.preventDefault();return;}
  dragId=button.dataset.slideId;
  event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',dragId);
  button.classList.add('is-dragging');
 });
 list.addEventListener('dragover',event=>{
  const li=event.target.closest('li');
  if(!dragId||!li||li.firstElementChild.dataset.slideId===dragId)return;
  event.preventDefault();event.dataTransfer.dropEffect='move';
  list.querySelectorAll('[data-drop]').forEach(el=>{if(el!==li)delete el.dataset.drop;});
  const box=li.getBoundingClientRect();
  const horizontal=list.scrollWidth>list.clientWidth+12&&getComputedStyle(list).display==='flex';
  li.dataset.drop=(horizontal?event.clientX<box.left+box.width/2:event.clientY<box.top+box.height/2)?'before':'after';
 });
 list.addEventListener('drop',event=>{
  event.preventDefault();
  const li=event.target.closest('li');
  if(dragId&&li?.dataset.drop){
   const next=moveSlide(slides,dragId,li.firstElementChild.dataset.slideId,li.dataset.drop);
   if(next!==slides){const moved=dragId;change(next);chosen=moved;showSelection({scroll:true});}
  }
  dragId=null;clearDrop();
 });
 list.addEventListener('dragend',()=>{dragId=null;clearDrop();});
 let fieldSnapshot;
 function refreshSelected(){
  const s=current();
  renderArt(preview,s);
  const button=list.querySelector('[aria-current=true]');
  renderArt(button.firstElementChild,s,true);
  button.querySelector('.editor-thumb-caption span').textContent=headings(s);
 }
 for(const field of [...fields,body,image,alt]){
  field.addEventListener('focus',()=>{fieldSnapshot=null;});
  field.addEventListener('input',()=>{
   if(saving)return;
   if(fieldSnapshot!==field){snapshot();fieldSnapshot=field;}
   const s=current();
   if(field===body){if(s.content)s.content.body[lang()]=field.value;else if(s.caption)s.caption[lang()]=field.value;else if(s.steps)s.steps[lang()]=field.value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);}
   else if(field===image){if(s.content)s.content.image=field.value.trim();else s.image=field.value.trim();}
   else if(field===alt){if(s.content)s.content.alt[lang()]=field.value;}
   else {const [key,code]=field.dataset.editField.split('.');s[key][code]=field.value;}
   if(!field.dataset.editField?.startsWith('notes.'))refreshSelected();
   sync();say(dirty?'Unsaved changes':'Ready');
  });
 }
 layout.addEventListener('change',()=>{
  snapshot();const s=current();
  if(layout.value==='original'){delete s.content;}
  else{
   const originalAlt=typeof s.alt==='string'?{en:s.alt,ja:s.alt}:s.alt;
   const originalBody=s.steps?{ja:s.steps.ja.join('\n').slice(0,480),en:s.steps.en.join('\n').slice(0,480)}:{...(s.caption??blank())};
   s.content={...(s.content??{body:originalBody,image:s.image??'',alt:originalAlt??blank()}),layout:layout.value};
  }
  showSelection();refreshSelected();say('Unsaved changes');
 });
 async function commitDraft(){
  if(!dirty||saving)return;
  if(slides.some(s=>!s.title.en.trim()||!s.title.ja.trim())){say('Every slide needs a title in both languages.');return;}
  if(slides.some(s=>(s.content?.image||s.content&&s.content.layout!=='type')&&!safeSlideImage(s.content.image) || !s.content&&s.image!==undefined&&!safeSlideImage(s.image))){say('Choose a valid image for each image slide.');return;}
  saving=true;sync();say('Saving…');
  try{
   const response=await fetch('/api/deck',{method:'POST',headers:{'Content-Type':'application/json','X-Lecture-Editor':token},body:JSON.stringify({revision,slides:trace(slides)})});
   const result=await response.json();
   if(!response.ok)throw Error(result.error||'Save failed.');
   revision=result.revision;
   slides=result.deck.slides.map(s=>({...s,sourceId:s.id}));
   baseline=fingerprint();undo=[];renderList();
   say('Saved locally. Ready to present.');
  }catch(error){say(error.message||'Save failed. Your draft is still open.');}
  finally{saving=false;sync();}
 }
 document.addEventListener('click',event=>{
  const name=event.target.closest('[data-edit-action]')?.dataset.editAction;
  if(!name||!slides.length||saving)return;
  const i=slides.findIndex(s=>s.id===chosen);
  if(name==='save')return void commitDraft();
  if(name==='ja'||name==='en'){ja=name==='ja';renderList();return;}
  if(name==='content-tab'||name==='notes-tab'){setPanel(name.split('-')[0]);return;}
  if(name==='up'&&i>0)return change(moveSlide(slides,chosen,slides[i-1].id,'before'));
  if(name==='down'&&i<slides.length-1)return change(moveSlide(slides,chosen,slides[i+1].id,'after'));
  if(name==='add'&&slides.length<200){
   const slide={id:`slide-${crypto.randomUUID()}`,sourceId:null,kind:'editable',title:{ja:'新しいスライド',en:'New slide'},notes:blank(),content:{layout:'type',body:blank(),image:'',alt:blank()}};
   const next=[...slides];next.splice(i+1,0,slide);
   snapshot();slides=next;chosen=slide.id;setPanel('content');renderList({scroll:true});say('New slide added.');const title=fields.find(f=>f.dataset.editField===`title.${lang()}`);title.focus();title.select();return;
  }
  if(name==='duplicate'&&slides.length<200){
   const copy={...structuredClone(current()),id:`copy-${crypto.randomUUID()}`};
   const next=[...slides];next.splice(i+1,0,copy);change(next);chosen=copy.id;showSelection({scroll:true});
  }
  if(name==='remove'&&slides.length>1){
   const next=slides.filter(s=>s.id!==chosen);
   snapshot();slides=next;chosen=next[Math.min(i,next.length-1)].id;renderList({scroll:true});say('Slide removed. Undo to restore before saving.');
  }
  if(name==='undo'&&undo.length){
   const previous=undo.pop();slides=previous.slides;chosen=previous.chosen;renderList({scroll:true});say(dirty?'Unsaved changes':'Ready');
  }
 });
 window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
 document.addEventListener('keydown',event=>{
  if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='s'){event.preventDefault();void commitDraft();}
 });
 if(location.hostname!=='127.0.0.1'){
  say('Open the editor at 127.0.0.1:8768 on the computer hosting the course.');return;
 }
 try{
  const [deckRes,chartRes,imagesRes]=await Promise.all([fetch('/api/deck',{cache:'no-store'}),fetch('/data/week07-examples.json'),fetch('/api/images')]);
  if(!deckRes.ok||!chartRes.ok)throw Error('Start the local editor server on port 8768 to edit this deck.');
  const result=await deckRes.json();data=await chartRes.json();({revision,token}=result);
  if(result.editorVersion!==2)throw Error('Restart the local editor server to enable content editing.');
  if(imagesRes.ok){const choices=(await imagesRes.json()).images;$('#editor-image-library').append(...choices.map(path=>{const option=document.createElement('option');option.value=path;return option;}));}
  slides=result.deck.slides.map(s=>({...s,sourceId:s.id}));
  baseline=fingerprint();
  const initial=new URLSearchParams(location.search).get('slide');
  chosen=slides.some(s=>s.id===initial)?initial:slides[0].id;
  $('.editor-workspace').hidden=false;save.hidden=false;renderList({scroll:true});say('Ready');
 }catch(error){say(error.message||'Could not load the local deck.');}
}
