export async function referenceItems(c,source,modelDocument){
 const base=modelDocument.baseURI,items=[];
 if(c.id==='suv-restyle'){
  const source=new URL('assets/concept-approved.png',base).href;
  // Exact display crop of the approved composite; no generated or model pixels.
  const raw=new Image();raw.src=source;await raw.decode();const canvas=document.createElement('canvas');canvas.width=536;canvas.height=370;canvas.getContext('2d').drawImage(raw,1000,80,536,370,0,0,536,370);
  return [{label:'改款造型 · 前侧45°',src:canvas.toDataURL('image/png'),source,note:'已确认改款造型参考 · 截取自案例图；其他角度暂无对应改款参考，不使用旧车型图替代。'}];
 }
 const catalog=await fetch('./reference-catalog.json?v=protected-colors-20261016').then(r=>{if(!r.ok)throw Error('参考目录加载失败');return r.json();});
 return catalog.cases[c.id]?.[source]||[];
}
export function mountReferenceGallery(c,items,host){
 document.querySelector('#original-reference-dialog')?.remove();if(!items.length)return;
 const dialog=document.createElement('dialog');dialog.id='original-reference-dialog';dialog.className='reference-gallery';dialog.setAttribute('aria-label',c.name+'原参考图');
 const header=document.createElement('div');header.className='reference-head';const heading=document.createElement('h2');heading.id='reference-heading';heading.textContent=c.name+' · 原参考图';dialog.setAttribute('aria-labelledby',heading.id);
 const close=document.createElement('button');close.type='button';close.className='reference-close';close.textContent='关闭 ×';close.setAttribute('aria-label','关闭原参考图');close.onclick=()=>dialog.close();header.append(heading,close);
 const body=document.createElement('div');body.className='reference-body';const rail=document.createElement('div');rail.className='reference-thumbnails';rail.setAttribute('aria-label','参考图角度');
 const main=document.createElement('div');main.className='reference-main';const caption=document.createElement('h3'),image=document.createElement('img'),message=document.createElement('p');message.className='reference-error';message.setAttribute('role','status');main.append(caption,image,message);body.append(rail,main);
 const footer=document.createElement('div');footer.className='reference-footer';const note=document.createElement('span');const nav=document.createElement('div');nav.className='reference-pagination';const prev=document.createElement('button'),next=document.createElement('button');prev.textContent='上一张';next.textContent='下一张';prev.type=next.type='button';nav.append(prev,next);footer.append(note,nav);
 let selected=0;const choices=[];const select=i=>{selected=(i+items.length)%items.length;const item=items[selected];caption.textContent=item.label+' · '+(selected+1)+' / '+items.length;message.textContent='';image.alt=c.name+' · '+item.label;image.src=item.src;note.textContent=item.note||items.length+' 张参考图 · 点击缩略图切换角度';choices.forEach((b,j)=>{b.classList.toggle('active',j===selected);b.setAttribute('aria-pressed',String(j===selected));});};
 items.forEach((item,i)=>{const b=document.createElement('button');b.type='button';b.className='reference-thumbnail';b.setAttribute('aria-label',item.label);const im=document.createElement('img');im.src=item.src;im.alt='';const label=document.createElement('span');label.textContent=item.label;const badge=document.createElement('small');badge.textContent=({original:'原图',generated:'生成补图',crop:'原图裁切',historical:'历史补图'})[item.kind]||'设计参考';b.append(im,label,badge);b.onclick=()=>select(i);rail.append(b);choices.push(b);});
 image.onerror=()=>message.textContent='参考图加载失败，请稍后重试。';prev.onclick=()=>select(selected-1);next.onclick=()=>select(selected+1);prev.disabled=next.disabled=items.length<2;
 dialog.append(header,body,footer);document.body.append(dialog);dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});dialog.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();select(selected+1);}if(e.key==='ArrowLeft'){e.preventDefault();select(selected-1);}});
 const trigger=document.createElement('button');trigger.type='button';trigger.id='original-reference-button';trigger.textContent='原参考图';trigger.onclick=()=>{select(selected);dialog.showModal();};host.prepend(trigger);select(0);return dialog;
}
