import {PANEL_DURATION,smoothstep} from '/demos/3d/outputs/case-browser/part-motion.js?v=part-motion-v1';
import * as T from 'three';
export function createVehicleInteraction(vehicle,scene){
 const doorIds=['LF','LR','RF','RR'],doors={},nodes=[];vehicle.updateMatrixWorld(true);vehicle.traverse(a=>{if(a.isMesh&&a.userData.doorId)nodes.push(a);});
 for(const id of doorIds){const members=nodes.filter(a=>a.userData.doorId===id);if(!members.length)throw Error('Missing articulated door '+id);const group=new T.Group();group.name='hinge_'+id;group.position.fromArray(members[0].userData.hinge);vehicle.add(group);group.updateMatrixWorld(true);for(const n of members)group.attach(n);doors[id]={group,progress:0,from:0,target:0,start:0,members:members.length};}
 const lids={};
 const lidSpecs={hood:{hinge:[1.12,1.145,0],angle:65,names:/^(hood_crowned|hood_panel_gap)/},trunk:{hinge:[-2.18,1.76,0],angle:-88,names:/^(sculpted_tailgate|tailgate_plate_|tailgate_shoulder|backlight|rear_glass_sill|continuous_tail_light|tail_light_sides|tail_lamp_dark_surround|tail_lens_backing|rear_light_signature|rear_light_vertical|rear_wordmark)/}};
 for(const [id,spec] of Object.entries(lidSpecs)){const members=[];vehicle.traverse(a=>{if(a.isMesh&&(a.userData.lidId===id||spec.names.test(a.name)||(id==='trunk'&&a.name.startsWith('number_plate')&&new T.Box3().setFromObject(a).getCenter(new T.Vector3()).x<0)))members.push(a);});if(id==='hood'){
  vehicle.updateMatrixWorld(true);const bounds=new T.Box3(),v=new T.Vector3(),points=[];
  for(const m of members){const pos=m.geometry.attributes.position;for(let i=0;i<pos.count;i++){v.fromBufferAttribute(pos,i).applyMatrix4(m.matrixWorld);bounds.expandByPoint(v);points.push(v.clone());}}
  const ys=points.filter(v=>v.x<bounds.min.x+.03).map(v=>v.y).sort((a,b)=>a-b);
  spec.hinge=[bounds.min.x,ys[Math.floor(ys.length/2)],0];
 }if(id==='trunk'){const mounted=members.find(a=>a.userData.tailgateHinge);if(mounted)spec.hinge=mounted.userData.tailgateHinge;}const group=new T.Group();group.name='hinge_'+id;group.position.fromArray(spec.hinge);vehicle.add(group);group.updateMatrixWorld(true);for(const n of members){group.attach(n);n.userData.clickAction=id;}lids[id]={group,progress:0,from:0,target:0,start:0,angle:spec.angle,members:members.length};}
 // Telescopic supports connect fixed D-pillar eyes to the moving hatch eyes.
 const struts=[];vehicle.updateMatrixWorld(true);
 for(const side of [-1,1]){let body,gate;vehicle.traverse(a=>{if(a.userData.strutSide===side){if(a.userData.strutBodyAnchor)body=a;if(a.userData.strutGateAnchor)gate=a;}});
  const A=new T.Vector3(...body.userData.strutBodyAnchor),B=new T.Vector3(...gate.userData.strutGateAnchor),local=lids.trunk.group.worldToLocal(vehicle.localToWorld(B.clone()));
  const mat=new T.MeshStandardMaterial({color:0x24282c,metalness:.5,roughness:.35}),rodMat=new T.MeshStandardMaterial({color:0x9ca5ac,metalness:.85,roughness:.23});mat.name='hatch_strut_barrel';rodMat.name='hatch_strut_rod';
  function cylinder(name,r,m){const a=new T.Mesh(new T.CylinderGeometry(r,r,1,16),m);a.name='hatch_mechanism_dynamic_'+name+'_'+side;a.castShadow=true;vehicle.add(a);return a;}
  struts.push({side,A,local,barrel:cylinder('barrel',.016,mat),rod:cylinder('rod',.007,rodMat),length:0,error:0});
 }
 function updateStruts(){vehicle.updateMatrixWorld(true);for(const s of struts){const B=vehicle.worldToLocal(lids.trunk.group.localToWorld(s.local.clone())),delta=B.clone().sub(s.A),length=delta.length(),dir=delta.normalize(),barrelLength=Math.min(.36,length-.035);const place=(mesh,a,b)=>{mesh.position.copy(a).add(b).multiplyScalar(.5);const d=b.clone().sub(a);mesh.scale.y=d.length();mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());};place(s.barrel,s.A.clone().addScaledVector(dir,.014),s.A.clone().addScaledVector(dir,barrelLength));place(s.rod,s.A.clone().addScaledVector(dir,.09),B.clone().addScaledVector(dir,-.014));s.length=length;const actual=gatePoint(s.side);s.error=actual.distanceTo(B);}}
 function gatePoint(side){let eye;vehicle.traverse(a=>{if(a.userData.strutSide===side&&a.userData.strutGateAnchor)eye=a;});return vehicle.worldToLocal(new T.Box3().setFromObject(eye).getCenter(new T.Vector3()));}
 // Recessed display compartments. These are inferred presentation interiors.
 const lining=new T.MeshStandardMaterial({color:0x24282a,roughness:.92,side:T.DoubleSide});
 function slab(name,x,y,z,w,h,d){const m=new T.Mesh(new T.BoxGeometry(w,h,d),lining);m.name=name;m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;vehicle.add(m);return m;}
 // Fit lining below the lowest closed hood vertex, so shape edits cannot expose old boxes.
 vehicle.updateMatrixWorld(true);const hoodBounds=new T.Box3().setFromObject(lids.hood.group),hx=(hoodBounds.min.x+hoodBounds.max.x)/2,hw=(hoodBounds.max.x-hoodBounds.min.x)*.74,hz=(hoodBounds.max.z-hoodBounds.min.z)*.31,ht=hoodBounds.min.y-.035,hb=ht-.22;
 slab('front_compartment_floor',hx,hb,0,hw,.035,hz*2);
 for(const z of [-hz,hz])slab('front_compartment_wall',hx,(ht+hb)/2,z,hw,ht-hb,.025);
 for(const x of [hx-hw/2,hx+hw/2])slab('front_compartment_wall',x,(ht+hb)/2,0,.025,ht-hb,hz*2);
 // Current cabin owns its cargo lining; never inject the legacy inter-row board.
 vehicle.traverse(a=>{if(a.isMesh&&a.userData.doorId)a.userData.clickAction=a.userData.doorId;});
 const lampMaterials=new Map();vehicle.traverse(a=>{if(a.isMesh&&['headlamps','taillamps'].includes(a.material.name)){lampMaterials.set(a.material,a.material.name);a.userData.clickAction='lights';}});
 vehicle.traverse(a=>{if(a.isMesh&&/^(lamp_optic|lamp_bezel|headlight_reflector|headlight_optic_recess|headlight_housing|headlight_inner_frame|fog_housing|tail_lamp_dark_surround|tail_lens_backing)/.test(a.name))a.userData.clickAction='lights';});
 const beams=[];for(const s of [-1,1]){const spot=new T.SpotLight(0xe7efff,0,10,.44,.8,2);spot.position.set(2.30,.84,s*.77);spot.target.position.set(7.0,0,s*.9);scene.add(spot,spot.target);beams.push(spot);}
 const offWhite=new T.Color('#293339'),onWhite=new T.Color('#f6f9ff'),offRed=new T.Color('#34090e'),onRed=new T.Color('#920d16');
 let light={value:1,from:1,target:1,start:0};
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 function advance(now){for(const d of Object.values(lids)){let u=T.MathUtils.clamp((now-d.start)/PANEL_DURATION,0,1);u=u*u*(3-2*u);d.progress=T.MathUtils.lerp(d.from,d.target,u);d.group.rotation.z=T.MathUtils.degToRad(d.angle)*d.progress;}for(const [id,d] of Object.entries(doors)){let u=Math.min(1,(now-d.start)/PANEL_DURATION);u=u*u*(3-2*u);d.progress=T.MathUtils.lerp(d.from,d.target,u);d.group.rotation.y=(id.startsWith('L')?-1:1)*T.MathUtils.degToRad(id.endsWith('F')?58:55)*d.progress;}let u=Math.min(1,(now-light.start)/450);u=u*u*(3-2*u);light.value=T.MathUtils.lerp(light.from,light.target,u);for(const [m,type] of lampMaterials){const head=type==='headlamps';m.color.copy(head?offWhite:offRed).lerp(head?onWhite:onRed,light.value);m.emissive.set(head?0xdcecff:0xff1420);m.emissiveIntensity=light.value*(head?.85:.55);}for(const b of beams)b.intensity=light.value*38;updateStruts();}
 function set(state,instant=false){const now=performance.now();advance(now);for(const id of doorIds){const d=doors[id],target=state.doors[id]?1:0;if(instant||reduced()){d.progress=d.from=d.target=target;d.start=now-1200;}else if(d.target!==target){d.from=d.progress;d.target=target;d.start=now;}}
  for(const [id,d] of Object.entries(lids)){const target=state[id]?1:0;if(instant||reduced()){d.progress=d.from=d.target=target;d.start=now-1200;}else if(d.target!==target){d.from=d.progress;d.target=target;d.start=now;}}
  const target=state.lights?1:0;if(instant||reduced()){light.value=light.from=light.target=target;light.start=now-500;}else if(light.target!==target){light.from=light.value;light.target=target;light.start=now;}advance(now);
 }
 const snapshot=()=>({struts:struts.map(s=>({side:s.side,length:s.length,endpointError:s.error})),lids:Object.fromEntries(Object.entries(lids).map(([id,d])=>[id,{progress:d.progress,angle:d.group.rotation.z,members:d.members}])),doors:Object.fromEntries(doorIds.map(id=>[id,{progress:doors[id].progress,angle:doors[id].group.rotation.y,members:doors[id].members}])),lights:light.value,beamIntensity:beams[0].intensity,animating:Object.values(lids).some(d=>Math.abs(d.progress-d.target)>.00001)||Object.values(doors).some(d=>Math.abs(d.progress-d.target)>.00001)||Math.abs(light.value-light.target)>.00001});
 return{set,advance,snapshot};
}
