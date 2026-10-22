// Exhibition lighting policy in vehicle-local coordinates. No model/pivot transforms.
const vehicleYaw={'suv-restyle':Math.PI/2,'zeekr-9x':Math.PI/2,'silver-suv':0,'yellow-sports-car':0};
const opticalFinish={roughness:.20,metalness:.55,clearcoat:1,clearcoatRoughness:.075};
export function mountVehicleLighting(r,id){
 if(!(id in vehicleYaw))return null;
 const {scene,root}=r,yaw=vehicleYaw[id],materials=new Map(),beams=new Map();
 const bounds=new r.T.Box3().setFromObject(root),size=bounds.getSize(new r.T.Vector3()),center=bounds.getCenter(new r.T.Vector3());
 scene.userData.vehicleGroundFootprint={...scene.userData.vehicleGroundFootprint,width:yaw?size.z:size.x,length:yaw?size.x:size.z,center:[Math.cos(yaw)*center.x-Math.sin(yaw)*center.z,Math.sin(yaw)*center.x+Math.cos(yaw)*center.z]};
 const previousYaw=scene.userData.vehiclePresentationYaw;
 scene.userData.vehiclePresentationYaw=yaw;
 scene.userData.vehicleSoftLightingScenes=['light','architecture','dark'];
 // Silver SUV uses a verified pigment shader with its own maps and normal treatment.
 // Its physical finish is already the standard; leave all of its materials intact.
 if(id!=='silver-suv')root.traverse(o=>{if(!o.isMesh)return;for(const m of Array.isArray(o.material)?o.material:[o.material])if(m.name==='paint'&&!materials.has(m))materials.set(m,Object.fromEntries(Object.keys(opticalFinish).map(k=>[k,m[k]])));});
 function apply(activate=true){
  scene.userData.vehiclePresentationYaw=yaw;
  if(activate)scene.userData.refreshVehicleLighting?.();
  for(const stage of scene.children)if(stage.name.startsWith('sports_presentation_')){stage.rotation.y=yaw;stage.updateMatrixWorld(true);}
  if(scene.environmentRotation)scene.environmentRotation.set(0,yaw,0);
  // Headlamp emitters still obey the existing on/off buttons. Exhibition mode does
  // not add headlamp beams to the ground for any vehicle, even when native updates
  // animate their power. Keep these lights in their original parent/pose.
  scene.traverse(o=>{if(o.isSpotLight){if(!beams.has(o))beams.set(o,o.visible);o.visible=false;}});
  for(const m of materials.keys())Object.assign(m,opticalFinish);
 }
 function getState(){return{vehicle:id,frontAxis:yaw?'positive-x':'positive-z',stageYaw:yaw,finish:id==='silver-suv'?'protected-existing-gloss':{...opticalFinish},groundHeadlightBeams:false,suppressedBeamCount:beams.size,calibratedPaintMaterials:materials.size};}
 function dispose(){for(const[m,values]of materials)Object.assign(m,values);for(const[o,visible]of beams)o.visible=visible;if(previousYaw===undefined)delete scene.userData.vehiclePresentationYaw;else scene.userData.vehiclePresentationYaw=previousYaw;delete scene.userData.vehicleSoftLightingScenes;delete scene.userData.vehicleGroundFootprint;delete r.vehicleLighting;}
 apply(false);const api={apply,getState,dispose};r.vehicleLighting=api;return api;
}
