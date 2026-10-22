export const PANEL_DURATION=1100;
export const FEEDBACK_DURATION=650;
export const smoothstep=t=>t*t*(3-2*t);

// Overlay feedback follows the real meshes without changing their materials or geometry.
export function mountPartMotion(r){
 const T=r.T,root=r.root||r.model.root,canvas=r.renderer.domElement,win=canvas.ownerDocument.defaultView;
 const abort=new win.AbortController(),group=new T.Group();group.name='unified-part-feedback';r.scene.add(group);
 let raf=0,pressed=null,started=0,items=[];
 const visible=o=>{for(let node=o;node;node=node.parent)if(!node.visible)return false;return true;};
 const render=()=>r.performanceController?r.performanceController.invalidate():r.renderer.render(r.scene,r.camera);
 function clear(){win.cancelAnimationFrame(raf);raf=0;for(const item of items){group.remove(item.overlay);item.overlay.material.dispose();}items=[];}
 function cancel(){clear();render();}
 function pulse(targets){
  r.performanceController?.interactiveFor(FEEDBACK_DURATION);
  clear();if(win.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const meshes=new Set();for(const target of targets||[])target?.traverse(o=>{if(o.isMesh&&visible(o))meshes.add(o);});
  for(const mesh of meshes){const material=new T.MeshBasicMaterial({color:0xf1d8a4,transparent:true,opacity:0,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,side:T.DoubleSide});
   const overlay=new T.Mesh(mesh.geometry,material);overlay.matrixAutoUpdate=false;overlay.renderOrder=10;overlay.frustumCulled=false;overlay.raycast=()=>{};group.add(overlay);items.push({mesh,overlay});}
  started=win.performance.now();
  function tick(now){const t=Math.min(1,(now-started)/FEEDBACK_DURATION);if(t===1){clear();render();return;}root.updateMatrixWorld(true);for(const {mesh,overlay}of items){overlay.matrix.copy(mesh.matrixWorld);overlay.material.opacity=.22*Math.sin(Math.PI*t);overlay.visible=visible(mesh);}render();raf=win.requestAnimationFrame(tick);}
  raf=win.requestAnimationFrame(tick);
 }
 const ray=new T.Raycaster(),pointer=new T.Vector2();
 canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;if(pressed){pressed.moved=true;return;}pressed={id:e.pointerId,x:e.clientX,y:e.clientY,time:win.performance.now(),moved:false};},{capture:true,signal:abort.signal});
 canvas.addEventListener('pointermove',e=>{if(pressed&&Math.hypot(e.clientX-pressed.x,e.clientY-pressed.y)>6)pressed.moved=true;},{capture:true,signal:abort.signal});
 canvas.addEventListener('pointercancel',()=>pressed=null,{capture:true,signal:abort.signal});
 canvas.addEventListener('pointerup',e=>{const p=pressed;pressed=null;if(!p||p.id!==e.pointerId||p.moved||win.performance.now()-p.time>650)return;const bounds=canvas.getBoundingClientRect();pointer.set((e.clientX-bounds.left)/bounds.width*2-1,1-(e.clientY-bounds.top)/bounds.height*2);root.updateMatrixWorld(true);ray.setFromCamera(pointer,r.camera);const hit=ray.intersectObject(root,true).find(h=>visible(h.object)&&h.object.material?.opacity!==0);if(hit){let target=hit.object;for(let node=target.parent;node&&node!==root;node=node.parent)if(/^(hinge_|DoorPivot_)/.test(node.name)){target=node;break;}pulse([target]);}},{capture:true,signal:abort.signal});
 return {pulse,cancel,dispose(){abort.abort();clear();group.removeFromParent();}};
}
