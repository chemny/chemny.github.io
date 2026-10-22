// On-demand rendering with full-resolution resting frames and lower-cost motion.
export function installPerformance({renderer,controls,step,isAnimating,draw}){
 const win=renderer.domElement.ownerDocument.defaultView,doc=win.document,canvas=renderer.domElement;
 let frame=0,dragging=false,until=0,last=0,draws=0,totalSubmit=0,motionFrames=0;
 const originalRender=renderer.render.bind(renderer);
 renderer.render=(...args)=>{const start=performance.now();originalRender(...args);draws++;totalSubmit+=performance.now()-start;};
 function resolution(moving){const w=canvas.clientWidth||1,h=canvas.clientHeight||1,budget=moving?1400000:4200000,ratio=Math.min(win.devicePixelRatio||1,moving?1:2,Math.sqrt(budget/(w*h)));if(Math.abs(renderer.getPixelRatio()-ratio)>.01)renderer.setPixelRatio(ratio);}
 function invalidate(){if(!frame&&!doc.hidden)frame=win.requestAnimationFrame(tick);}
 function tick(now){frame=0;if(doc.hidden)return;const active=dragging||now<until||isAnimating();resolution(active);step(now,Math.min((now-last)/1000,.1));last=now;draw();if(active)motionFrames++;if(active||isAnimating())invalidate();}
 function interactiveFor(ms){until=Math.max(until,performance.now()+ms);invalidate();}
 controls.addEventListener('start',()=>{dragging=true;invalidate();});controls.addEventListener('end',()=>{dragging=false;interactiveFor(180);});controls.addEventListener('change',invalidate);
 doc.addEventListener('click',()=>queueMicrotask(invalidate),true);doc.addEventListener('change',()=>queueMicrotask(invalidate),true);
 doc.addEventListener('visibilitychange',()=>{if(doc.hidden){win.cancelAnimationFrame(frame);frame=0;}else invalidate();});
 canvas.addEventListener('pointerdown',()=>interactiveFor(200),{passive:true});canvas.addEventListener('pointermove',e=>{if(e.buttons)interactiveFor(180);},{passive:true});canvas.addEventListener('wheel',()=>interactiveFor(220),{passive:true});
 win.addEventListener('resize',invalidate);invalidate();
 return {invalidate,interactiveFor,renderNow(){resolution(false);draw();},stats:()=>({draws,motionFrames,meanSubmitMs:totalSubmit/Math.max(1,draws),scheduled:!!frame,pixelRatio:renderer.getPixelRatio(),motionPixelRatioMax:1,restPixelRatioMax:2})};
}
