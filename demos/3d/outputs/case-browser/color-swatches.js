// Keep one visible choice per actual display color; original-color restoration wins ties.
export function dedupeSwatches(host){
 const seen=new Map();
 const buttons=[...host.querySelectorAll(':scope > button.swatch')].sort((a,b)=>Number(b.classList.contains('default-color'))-Number(a.classList.contains('default-color')));
 for(const button of buttons){button.hidden=false;const color=getComputedStyle(button).backgroundColor;const first=seen.get(color);if(first){button.hidden=true;if(button.classList.contains('active')){first.classList.add('active');first.setAttribute('aria-pressed','true');}}else seen.set(color,button);}
 // Reduce near-identical choices deterministically, always protecting the source color.
 const visible=buttons.filter(button=>!button.hidden);
 const rgb=button=>getComputedStyle(button).backgroundColor.match(/[\d.]+/g).slice(0,3).map(Number);
 while(visible.length>6){let pair,distance=Infinity;for(let i=0;i<visible.length;i++)for(let j=i+1;j<visible.length;j++){const a=rgb(visible[i]),b=rgb(visible[j]);const delta=a.reduce((sum,value,k)=>sum+(value-b[k])**2,0);if(delta<distance){distance=delta;pair=[i,j];}}const remove=visible[pair[1]].classList.contains('default-color')?pair[0]:pair[1];visible.splice(remove,1)[0].hidden=true;}
}
