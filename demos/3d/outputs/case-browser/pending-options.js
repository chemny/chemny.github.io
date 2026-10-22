import {dedupeSwatches} from './color-swatches.js?v=six-colors-v1';
// Lightweight selections are scoped to a single navigation, never to a model runtime.
export function mountPendingOptions({caseId,section,button,paints,wheels,scenes}){
 const vehicle=['suv-restyle','silver-suv','yellow-sports-car'].includes(caseId);
 const pending=new Map();
 const palette=[['暖杏色','#c99b78'],['米白色','#e6d8c4'],['雾灰色','#9da4a8'],['鼠尾草绿','#7b9683'],['湖蓝色','#5d9aab'],['玫瑰粉','#c08d98']];
 const groups=vehicle?[['paint','车身颜色',paints],['wheel','轮毂款式',wheels],['scene','展示场景',scenes]]:[['color',caseId==='cloth-doll'?'衣服颜色':'部件颜色',palette.map(([label,color])=>[color,label,color])],['scene','展示场景',scenes]];
 for(const[key,title,items]of groups){
  const s=section(title),host=document.createElement('div');host.className=['paint','color'].includes(key)?'swatches':key==='wheel'?'choices cards':'lighting';s.append(host);
  for(const[id,label,color]of items){
   const b=button(host,label,()=>{pending.set(key,key==='color'?label:id);host.querySelectorAll('button').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});note.textContent='已预选，模型就绪后自动应用';});
   b.dataset.pendingOption=key;b.dataset.pendingValue=id;
   if(['paint','color'].includes(key)){b.className='swatch';b.style.background=key==='paint'&&id==='default'?(caseId==='yellow-sports-car'?'#ffd20a':'#161c22'):(color||id);b.textContent='';b.title=label;if(key==='paint'&&id==='default')b.classList.add('default-color');}
   if(key==='wheel')b.className='choice-card';
  }
  if(['paint','color'].includes(key))dedupeSwatches(host);
  const note=document.createElement('p');note.className='pending-note';note.textContent=key==='color'?(caseId==='cloth-doll'?'仅调整衣服；模型就绪后可使用完整选项。':'可预选整体颜色；模型就绪后可选择具体部件。'):'可先选择，模型就绪后自动应用';s.append(note);
 }
 const message=document.querySelector('#message');message.textContent='模型加载中，保存、视角与开合操作将在就绪后显示。';
 return {apply(){
  for(const[key,value]of pending){
   const selector=key==='scene'&&!vehicle?'[data-object-scene]':key==='color'?'.object-swatches button':`[data-option="${key}"]`;
   const target=[...document.querySelectorAll(selector)].find(b=>key==='color'?b.getAttribute('aria-label')===value:(b.dataset.value||b.dataset.objectScene)===value);
   if(key==='color'&&caseId==='blue-teapot'){
    const part=document.querySelector('select[aria-label="选择部件"]');if(part&&[...part.options].some(o=>o.value==='all')){part.value='all';part.dispatchEvent(new Event('change'));}
   }
   target?.click();
  }
  message.textContent=pending.size?'已应用加载期间的预选项':'';
 }};
}
