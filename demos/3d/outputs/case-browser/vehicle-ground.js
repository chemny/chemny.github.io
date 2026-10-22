// Contact datum is measured from the actual closed-wheel geometry, never the body box.
export function measureVehicleGround(r,id){
 const T=r.T,root=r.root;root.updateMatrixWorld(true);const wheels=[];
 if(id!=='silver-suv'){
  root.traverse(o=>{if(o.isMesh&&(id==='suv-restyle'?/^tire_\d+$/.test(o.name):/^wheels_split_(LF|RF|LR|RR)_tire$/.test(o.name))){const b=new T.Box3().setFromObject(o),c=b.getCenter(new T.Vector3()),s=b.getSize(new T.Vector3());wheels.push({id:o.name,center:[c.x,c.z],sole:b.min.y,width:id==='suv-restyle'?s.z:s.x});}});
 }else{
  const anchors=['FrontLeft','FrontRight','RearLeft','RearRight'].map(name=>{const o=root.getObjectByName(name+'RimLip');if(!o)throw Error('缺少轮胎测量锚点 '+name);const b=new T.Box3().setFromObject(o),c=b.getCenter(new T.Vector3());return {id:name,c,radius:(b.max.y-b.min.y)*.72,min:Infinity,x:0,z:0,n:0};});
  const p=new T.Vector3();root.traverse(o=>{if(!o.isMesh)return;const a=o.geometry.attributes.position;if(!a)return;const b=new T.Box3().setFromObject(o);if(b.min.y>Math.max(...anchors.map(w=>w.c.y)))return;for(let i=0;i<a.count;i++){p.fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld);for(const w of anchors){if(p.y>w.c.y||Math.abs(p.z-w.c.z)>w.radius||Math.abs(p.x-w.c.x)>.32)continue;if(p.y<w.min-.0001){w.min=p.y;w.x=p.x;w.z=p.z;w.n=1;}else if(Math.abs(p.y-w.min)<=.0001){w.x+=p.x;w.z+=p.z;w.n++;}}}});
  for(const w of anchors){if(!w.n||!Number.isFinite(w.min))throw Error('无法核实轮胎接地点 '+w.id);wheels.push({id:w.id,center:[w.x/w.n,w.z/w.n],sole:w.min,width:.25});}
 }
 if(wheels.length!==4)throw Error('轮胎接地核实需要四个轮胎，实际 '+wheels.length);
 const groundY=Math.min(...wheels.map(w=>w.sole))-.0005;
 const result={groundY,wheels,gaps:wheels.map(w=>({id:w.id,gap:w.sole-groundY})),method:'actual-world-space-tire-geometry',contactApproximation:'Measured wheel contacts with analytical soft occlusion; directional shadow remains enabled.'};
 r.scene.userData.vehicleGroundFootprint={groundY,wheels};return result;
}
