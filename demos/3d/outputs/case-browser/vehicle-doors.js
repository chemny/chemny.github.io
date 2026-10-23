import {repairSilverRearDoors} from './silver-door-repair.js?v=loading-v1-20261023';
import {assembleSportsDoors} from './sports-door-assembly.js';
export function mountVehicleDoors({r,win,doc,caseId,source,onChange}){
 const T=r.T,canvas=r.renderer.domElement,abort=new win.AbortController(),api=win.configurator||win.vehicleConfigurator;
 const silverRepair=caseId==='silver-suv'?repairSilverRearDoors(r):null;
 const sports=caseId==='yellow-sports-car',assembly=sports?assembleSportsDoors(r,source):null;
 const ids=sports?['LF','RF']:['LF','RF','LR','RR'];const labels=sports?{LF:'左车门',RF:'右车门'}:{LF:'左前门',RF:'右前门',LR:'左后门',RR:'右后门'};
 const local=Object.fromEntries(ids.map(id=>[id,false])),motions=new Map();let raf=0,press=null;const pointers=new Set();
 const originalPaint=r.paint;if(assembly)r.paint=color=>{originalPaint(color);for(const item of assembly.materialBindings||[])item.door.material=item.mesh.material;};
 const read=()=>{if(sports)return {...local};const doors=api.getState().doors;return Object.fromEntries(ids.map(id=>[id,!!(doors[id]??doors['DoorPivot_'+id])]));};
 const render=()=>{r.renderer.shadowMap.needsUpdate=true;if(r.performanceController)r.performanceController.invalidate();else r.renderer.render(r.scene,r.camera);};
 function tick(now){raf=0;for(const[id,m]of motions){const t=Math.min(1,(now-m.start)/1100),e=t*t*(3-2*t);assembly.pivots[id].rotation.y=m.from+(m.to-m.from)*e;if(t===1)motions.delete(id);}for(const pivot of Object.values(assembly.pivots))pivot.traverse(o=>{if(o.name.startsWith('InferredDoor'))o.visible=Math.abs(pivot.rotation.y)>1e-6;});render();if(motions.size)raf=win.requestAnimationFrame(tick);}
 function set(id,open,instant=false){if(!ids.includes(id)||typeof open!=='boolean')throw Error('无效车门操作');if(sports){local[id]=open;const pivot=assembly.pivots[id],to=open?(id==='LF'?-1:1)*assembly.recipe.angle:0;if(instant||win.matchMedia('(prefers-reduced-motion: reduce)').matches){pivot.rotation.y=to;motions.delete(id);pivot.traverse(o=>{if(o.name.startsWith('InferredDoor'))o.visible=Math.abs(to)>1e-6;});render();}else{motions.set(id,{from:pivot.rotation.y,to,start:win.performance.now()});if(!raf)raf=win.requestAnimationFrame(tick);}}else if(caseId==='suv-restyle')api.setDoors(id,open);else{const button=doc.querySelector(`#doors button[data-door-id="${id}"]`);if(!button)throw Error('缺少车门绑定 '+id);if(read()[id]!==open)button.click();}onChange?.();}
 if(caseId==='silver-suv'){
  const native=[...doc.querySelectorAll('#doors button')];const keys=Object.keys(api.getState().doors);for(let i=0;i<native.length;i++){const id=keys[i]?.match(/(LF|LR|RF|RR)$/)?.[1];if(id)native[i].dataset.doorId=id;}
 }
 const validate=state=>{if(state&&(!ids.every(id=>typeof state[id]==='boolean')||Object.keys(state).length!==ids.length))throw Error('车门状态与车型不匹配');};
 const restore=(state,instant=true)=>{validate(state);for(const id of ids)set(id,state?.[id]??false,instant);};
 const ray=new T.Raycaster(),pointer=new T.Vector2();const visible=o=>{for(let n=o;n;n=n.parent)if(!n.visible)return false;return true;};
 function pick(x,y){const box=canvas.getBoundingClientRect();pointer.set((x-box.left)/box.width*2-1,1-(y-box.top)/box.height*2);r.root.updateMatrixWorld(true);r.camera.updateMatrixWorld();ray.setFromCamera(pointer,r.camera);const hit=ray.intersectObject(r.root,true).find(h=>visible(h.object)&&h.object.material?.opacity!==0);if(!hit)return null;for(let n=hit.object;n&&n!==r.root;n=n.parent){const id=n.userData.doorId||n.userData.clickAction||n.name.match(/(?:DoorPivot_|hinge_)(LF|LR|RF|RR)$/)?.[1];if(ids.includes(id))return id;}return null;}
 // The full-size SUV already owns correct native hit testing; never add a second toggle.
 if(caseId!=='suv-restyle'){
  canvas.addEventListener('pointerdown',e=>{pointers.add(e.pointerId);if(pointers.size!==1||e.pointerType==='mouse'&&e.button!==0){press=null;return;}press={id:e.pointerId,x:e.clientX,y:e.clientY,time:win.performance.now(),moved:false};},{capture:true,signal:abort.signal});
  canvas.addEventListener('pointermove',e=>{if(press&&Math.hypot(e.clientX-press.x,e.clientY-press.y)>6)press.moved=true;},{capture:true,signal:abort.signal});
  canvas.addEventListener('pointercancel',e=>{press=null;pointers.delete(e.pointerId);},{capture:true,signal:abort.signal});
  canvas.addEventListener('pointerup',e=>{pointers.delete(e.pointerId);const p=press;press=null;if(!p||p.id!==e.pointerId||p.moved||win.performance.now()-p.time>650||Math.hypot(e.clientX-p.x,e.clientY-p.y)>6)return;const id=pick(e.clientX,e.clientY);if(id){r.controls.autoRotate=false;set(id,!read()[id]);}},{capture:true,signal:abort.signal});
 }
 restore(null);return {items:ids.map(id=>({id,label:labels[id]})),getState:read,validate,set,toggle:id=>set(id,!read()[id]),restore,pick,audit:assembly?.audit||silverRepair?.audit||null,dispose(){abort.abort();win.cancelAnimationFrame(raf);r.paint=originalPaint;assembly?.dispose();silverRepair?.dispose();}};
}
