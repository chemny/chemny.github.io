export const VIEW_DURATION=900;
export function mountViewMotion(r){
 const T=r.T,canvas=r.renderer.domElement,win=canvas.ownerDocument.defaultView,abort=new win.AbortController();
 let frame=0,motion=null,settings=null;
 const root=()=>r.root||r.model.root;
 const center=()=>r.controls?r.controls.target.clone():new T.Box3().setFromObject(root()).getCenter(new T.Vector3());
 const capture=()=>{const c=r.camera;return {position:c.position.clone(),target:center(),up:c.up.clone(),zoom:c.zoom,fov:c.fov,top:c.top,bottom:c.bottom,left:c.left,right:c.right};};
 const render=()=>{r.camera.updateMatrixWorld();if(r.performanceController)r.performanceController.invalidate();else r.renderer.render(r.scene,r.camera);};
 function apply(s){const c=r.camera;c.position.copy(s.position);c.up.copy(s.up);c.zoom=s.zoom;if(c.isPerspectiveCamera&&s.fov)c.fov=s.fov;if(c.isOrthographicCamera&&s.top!==undefined)for(const key of ['top','bottom','left','right'])c[key]=s[key];if(r.controls)r.controls.target.copy(s.target);c.lookAt(s.target);c.updateProjectionMatrix();}
 function cancel(){win.cancelAnimationFrame(frame);frame=0;motion=null;if(settings){const c=r.controls,current=capture();c.enabled=settings.enabled;c.enableDamping=false;c.autoRotate=false;c.update();apply(current);c.enableDamping=settings.damping;c.autoRotate=settings.rotate;settings=null;}render();}
 function run(select){
  r.performanceController?.interactiveFor(VIEW_DURATION);cancel();if(r.controls){const c=r.controls,current=capture(),damping=c.enableDamping,rotate=c.autoRotate;c.enableDamping=false;c.autoRotate=false;c.update();apply(current);c.enableDamping=damping;c.autoRotate=rotate;}const from=capture();select();const to=capture();
  if(win.matchMedia('(prefers-reduced-motion: reduce)').matches){apply(to);render();return;}
  const a=new T.Spherical().setFromVector3(from.position.clone().sub(from.target)),b=new T.Spherical().setFromVector3(to.position.clone().sub(to.target));
  const delta=T.MathUtils.euclideanModulo(b.theta-a.theta+Math.PI,2*Math.PI)-Math.PI;
  if(r.controls){const c=r.controls;settings={enabled:c.enabled,damping:c.enableDamping,rotate:c.autoRotate};c.enabled=false;c.enableDamping=false;c.autoRotate=false;}
  const start=win.performance.now();motion={start};apply(from);render();
  function tick(now){const t=Math.min(1,(now-start)/VIEW_DURATION),e=t*t*(3-2*t),target=from.target.clone().lerp(to.target,e),spherical=new T.Spherical(T.MathUtils.lerp(a.radius,b.radius,e),T.MathUtils.clamp(T.MathUtils.lerp(a.phi,b.phi,e),.0001,Math.PI-.0001),a.theta+delta*e);
   const state={position:new T.Vector3().setFromSpherical(spherical).add(target),target,up:from.up.clone().lerp(to.up,e).normalize()};for(const key of ['zoom','fov','top','bottom','left','right'])if(Number.isFinite(from[key])&&Number.isFinite(to[key]))state[key]=T.MathUtils.lerp(from[key],to[key],e);apply(state);
   // Keep the subject inside the frame along the arc, including the transition to top view.
   const c=r.camera,box=new T.Box3().setFromObject(root());c.updateMatrixWorld();let fit=1;
   for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const p=new T.Vector3(x,y,z).project(c);fit=Math.max(fit,Math.abs(p.x)/.92,Math.abs(p.y)/.88);}
   if(fit>1)c.zoom/=fit;c.updateProjectionMatrix();render();
   if(t<1)frame=win.requestAnimationFrame(tick);else{apply(to);cancel();}
  }
  frame=win.requestAnimationFrame(tick);
 }
 const interrupt=e=>{if(e.target===canvas&&motion)cancel();};
 win.addEventListener('pointerdown',interrupt,{capture:true,signal:abort.signal});win.addEventListener('wheel',interrupt,{capture:true,passive:true,signal:abort.signal});
 win.addEventListener('resize',()=>{if(motion)cancel();},{signal:abort.signal});
 return {run,cancel,get active(){return !!motion;},dispose(){cancel();abort.abort();}};
}
