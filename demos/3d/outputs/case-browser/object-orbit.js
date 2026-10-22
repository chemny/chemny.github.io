// Interactive presentation only: never modifies frozen reference cameras or model geometry.
export function mountObjectOrbit(runtime,{onRotate=()=>{},getFitDistance=()=>null}={}){
 const T=runtime.T,canvas=runtime.renderer.domElement,win=canvas.ownerDocument.defaultView,abort=new win.AbortController();
 const points=new Map();let activeCamera=null,target=new T.Vector3(),minDistance=0,maxDistance=0,groundY=0,radius=1,pinched=false,wasDragged=false;
 const render=()=>{const c=runtime.camera;c.updateMatrixWorld();runtime.renderer.render(runtime.scene,c);};
 function rebind(){activeCamera=runtime.camera;const box=new T.Box3().setFromObject(runtime.model.root);target=box.getCenter(new T.Vector3());groundY=box.min.y;radius=Math.max(box.getSize(new T.Vector3()).length()/2,.01);const distance=getFitDistance(activeCamera)||activeCamera.position.distanceTo(target);minDistance=Math.max(radius*1.15,distance/1.65);maxDistance=distance/.55;points.clear();pinched=false;constrain();}
 function constrain(){
  const c=activeCamera;if(!c)return;
  const s=new T.Spherical().setFromVector3(c.position.clone().sub(target));
  s.phi=T.MathUtils.clamp(s.phi,.035,Math.PI/2-Math.PI/18);
  if(c.isOrthographicCamera){
   // Parallel rays at the bottom of the frustum must also start above the floor.
   // Moving an orthographic camera along its view axis does not change framing.
   const halfHeight=(c.top-c.bottom)/(2*c.zoom);
   const required=(groundY+radius*.02-target.y+halfHeight*Math.sin(s.phi))/Math.cos(s.phi);
   s.radius=Math.max(s.radius,required+c.near);
   c.far=Math.max(c.far,s.radius+radius*40);c.updateProjectionMatrix();
  }
  c.position.copy(target).add(new T.Vector3().setFromSpherical(s));c.up.set(0,1,0);c.lookAt(target);
 }
 function camera(){if(activeCamera!==runtime.camera)rebind();return runtime.camera;}
 function zoom(factor){const c=camera();if(c.isOrthographicCamera){c.zoom=T.MathUtils.clamp(c.zoom/factor,.55,1.65);c.updateProjectionMatrix();}else{const offset=c.position.clone().sub(target),distance=T.MathUtils.clamp(offset.length()*factor,minDistance,maxDistance);c.position.copy(target).add(offset.setLength(distance));}constrain();render();}
 function orbit(dx,dy){const c=camera(),spherical=new T.Spherical().setFromVector3(c.position.clone().sub(target));spherical.theta-=dx*.006;spherical.phi=T.MathUtils.clamp(spherical.phi-dy*.006,.035,Math.PI/2-Math.PI/18);c.position.copy(target).add(new T.Vector3().setFromSpherical(spherical));c.up.set(0,1,0);c.lookAt(target);constrain();onRotate();render();}
 const stop=e=>{e.preventDefault();e.stopImmediatePropagation();};
 const opts={capture:true,passive:false,signal:abort.signal};canvas.style.touchAction='none';
 canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;camera();stop(e);points.set(e.pointerId,{x:e.clientX,y:e.clientY});if(points.size===1){pinched=false;wasDragged=false;}if(points.size>1)pinched=true;canvas.setPointerCapture(e.pointerId);},opts);
 canvas.addEventListener('pointermove',e=>{if(!points.has(e.pointerId))return;stop(e);const before=points.get(e.pointerId),next={x:e.clientX,y:e.clientY},values=[...points.values()];if(points.size===2){const oldDistance=Math.hypot(values[0].x-values[1].x,values[0].y-values[1].y);points.set(e.pointerId,next);const after=[...points.values()],newDistance=Math.hypot(after[0].x-after[1].x,after[0].y-after[1].y);if(oldDistance>1&&newDistance>1)zoom(oldDistance/newDistance);wasDragged=true;}else{points.set(e.pointerId,next);if(!pinched){const dx=next.x-before.x,dy=next.y-before.y;if(dx||dy){wasDragged=true;orbit(dx,dy);}}}},opts);
 const release=e=>{if(!points.has(e.pointerId))return;stop(e);points.delete(e.pointerId);if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);if(!points.size)pinched=false;};
 canvas.addEventListener('pointerup',release,opts);canvas.addEventListener('pointercancel',release,opts);canvas.addEventListener('lostpointercapture',e=>{points.delete(e.pointerId);if(!points.size)pinched=false;},{signal:abort.signal});
 canvas.addEventListener('wheel',e=>{stop(e);const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?win.innerHeight:1);zoom(Math.exp(T.MathUtils.clamp(delta*.001,-1,1)));},opts);
 canvas.addEventListener('click',e=>{if(wasDragged){stop(e);wasDragged=false;}},opts);
 rebind();return {rebind,dispose(){abort.abort();for(const id of points.keys())if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);points.clear();}};
}
