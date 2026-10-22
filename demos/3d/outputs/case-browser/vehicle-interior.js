// Local iteration recipe: retain the exterior; infer only previously unspecified cabin detail.
export function mountVehicleInterior({r,win,caseId,source,doors}){
 const T=r.T,root=r.root,added=new T.Group();added.name='InteriorV1_InferredCabin';root.add(added);const hidden=[],geometries=new Set(),materials=new Set(),textures=new Set(),doorGroups=[];
 const sports=caseId==='yellow-sports-car',silver=caseId==='silver-suv',enhance=sports||silver;
 const material=(name,color,roughness=.78,metalness=0)=>{const m=new T.MeshStandardMaterial({color,roughness,metalness});m.name='InteriorV1_'+name;materials.add(m);return m;};
 const leather=material('Leather',silver?'#b9aa91':'#a29277'),inset=material('PerforatedInsert',silver?'#a89b85':'#8d7f69'),dark=material('SoftTrim','#222629'),carpet=material('Carpet','#34332f',.98),metal=material('SatinMetal','#919594',.38,.75),stitch=material('Piping','#d4c9b5',.85),rubber=material('Rubber','#161a1d',.95);
 function add(g,m,name,pos,parent=added){geometries.add(g);const o=new T.Mesh(g,m);o.name='InteriorV1_'+name;o.position.set(...pos);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 function rounded(w,h,d,rad=.025){const x=-w/2,y=-h/2,r=Math.min(rad,w*.2,h*.2,d*.25),s=new T.Shape();s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);const g=new T.ExtrudeGeometry(s,{depth:d-r*.6,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:r*.3,bevelThickness:r*.3,curveSegments:6});g.translate(0,0,-(d-r*.6)/2);return g;}
 const box=(name,size,pos,m=dark,parent=added)=>add(rounded(...size),m,name,pos,parent);
 function pipe(name,points,m=stitch,parent=added,radius=.0015){return add(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),32,radius,5,false),m,name,[0,0,0],parent);}
 function bucketSeat(name,x,z,y,width){
  const g=new T.Group();g.name='InteriorV1_'+name;g.position.set(x,y,z);added.add(g);
  // Continuous concave upholstery with rising thigh and torso bolsters.
  function patch(label,fn,mat){const v=[],ix=[],nu=40,nv=40;for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++)v.push(...fn(i/nu*2-1,j/nv));for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){let a=j*(nu+1)+i,b=a+1,c=a+nu+1,d=c+1;ix.push(a,c,b,b,c,d);}if(label==='_BucketBack'||label==='_BucketCushion'){const count=v.length/3,baseFaces=ix.slice(),axis=label==='_BucketBack'?2:1;for(let k=0;k<count;k++){const point=v.slice(k*3,k*3+3);point[axis]-=.025;v.push(...point);}for(let k=0;k<baseFaces.length;k+=3)ix.push(baseFaces[k]+count,baseFaces[k+2]+count,baseFaces[k+1]+count);const edge=[];for(let i=0;i<=nu;i++)edge.push(i);for(let j=1;j<=nv;j++)edge.push(j*(nu+1)+nu);for(let i=nu-1;i>=0;i--)edge.push(nv*(nu+1)+i);for(let j=nv-1;j>0;j--)edge.push(j*(nu+1));for(let k=0;k<edge.length;k++){const a=edge[k],b=edge[(k+1)%edge.length];ix.push(a,b,a+count,b,b+count,a+count);}}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(v,3));geo.setIndex(ix);geo.computeVertexNormals();const m=mat.clone();m.side=T.DoubleSide;materials.add(m);return add(geo,m,name+label,[0,0,0],g);}
  patch('_BucketCushion',(u,t)=>[u*width*.5,.035+.065*Math.pow(Math.abs(u),4)+.025*Math.sin(t*Math.PI),-.27+t*.57],leather);
  patch('_BucketBack',(u,t)=>{const w=width*(.40+.10*Math.sin(t*Math.PI)-.15*Math.pow(t,5));return [u*w,.06+t*.72,-.28-.13*t+.105*Math.pow(Math.abs(u),3)*Math.sin(Math.PI*t)+.025*Math.sin(t*Math.PI*2)];},leather);
  patch('_CushionInsert',(u,t)=>[u*width*.30,.040+.025*Math.sin((.1+t*.8)*Math.PI),-.213+t*.456],inset);
  patch('_BackInsert',(u,t)=>[u*width*(.25-.08*t),.12+t*.52,-.28-.13*((.06+t*.52)/.72)+.025*Math.sin((.06+t*.52)/.72*Math.PI*2)+.007],inset);
  for(const sign of[-1,1]){pipe(name+'_BucketSeam'+sign,[[sign*width*.33,.085,.25],[sign*width*.36,.09,0],[sign*width*.33,.12,-.23],[sign*width*.38,.40,-.24],[sign*width*.28,.68,-.35]],stitch,g,.002);box(name+'_Rail'+sign,[.025,.022,.48],[sign*width*.3,-.067,0],metal,g);}
  box(name+'_SeatMount',[width*.65,.115,.42],[0,-.0475,-.02],dark,g);
 }
 function seat(name,x,z,y,width=.49){if(sports)return bucketSeat(name,x,z,y,width);const g=new T.Group();g.name='InteriorV1_'+name;g.position.set(x,y,z);added.add(g);
  box(name+'_Pedestal',[width*.7,.12,.46],[0,-.13,-.01],dark,g);for(const s of[-1,1])box(name+'_Rail'+s,[.027,.025,.55],[s*width*.3,-.2,0],metal,g);
  box(name+'_Cushion',[width,.13,.62],[0,0,0],leather,g);box(name+'_CushionInsert',[width*.65,.018,.46],[0,.074,.015],inset,g);
  const back=new T.Group();back.name=name+'_BackGroup';back.position.set(0,.37,-.255);back.rotation.x=-.13;g.add(back);box(name+'_Back',[width*.92,.60,.115],[0,0,0],leather,back);box(name+'_BackInsert',[width*.61,.44,.024],[0,-.015,.073],inset,back);
  for(const sign of[-1,1]){box(name+'_Bolster'+sign,[width*.16,.46,.14],[sign*width*.39,-.03,.065],leather,back);pipe(name+'_BackStitch'+sign,[[sign*width*.29,-.22,.091],[sign*width*.31,0,.091],[sign*width*.29,.20,.091]],stitch,back);box(name+'_HeadrestPost'+sign,[.014,.09,.014],[sign*.065,.34,-.01],metal,back);}
  box(name+'_Headrest',[width*.62,.16,.11],[0,.44,-.005],leather,back);
  for(const sign of[-1,1])pipe(name+'_SeatStitch'+sign,[[sign*width*.34,.078,-.24],[sign*width*.36,.078,0],[sign*width*.34,.078,.24]],stitch,g);
  for(let i=0;i<4;i++)box(name+'_BackPleat'+i,[width*.56,.002,.002],[0,.17-i*.09,.087],leather,back);
 }
 function display(name,width,height,pos,driver=false){box(name+'_Housing',[width+.022,height+.025,.028],pos,dark);const canvas=win.document.createElement('canvas');canvas.width=768;canvas.height=320;const ctx=canvas.getContext('2d');ctx.fillStyle='#111b20';ctx.fillRect(0,0,768,320);ctx.fillStyle='#d9e7dd';ctx.font='20px sans-serif';ctx.fillText(driver?'READY':'DRIVE · COMFORT',36,40);ctx.font=driver?'110px sans-serif':'46px sans-serif';ctx.fillText(driver?'0':'21°',42,168);ctx.font='22px sans-serif';ctx.fillText(driver?'km/h':'CLIMATE',48,212);ctx.strokeStyle='#537369';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(270,240);ctx.bezierCurveTo(320,160,310,130,520,82);ctx.stroke();ctx.font='20px sans-serif';ctx.fillText('84%   ·   320 km',430,278);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;textures.add(texture);const m=new T.MeshBasicMaterial({map:texture,toneMapped:false});m.name='InteriorV1_Display';materials.add(m);const screen=add(new T.PlaneGeometry(width,height),m,name,[pos[0],pos[1],pos[2]-.017]);screen.rotation.y=Math.PI;}
 const repaired=[];
 if(sports){
  for(const [side,sign] of [['left',1],['right',-1]]){
   const handle=root.getObjectByName('handle_'+side);if(handle){handle.traverse(o=>{if(!o.isMesh)return;repaired.push([o,o.geometry,o.material]);o.geometry=rounded(.016,.029,.155,.009);geometries.add(o.geometry);});
    root.updateMatrixWorld(true);const center=new T.Box3().setFromObject(handle).getCenter(new T.Vector3());root.worldToLocal(center);const pocket=box('HandlePocket_'+side,[.012,.041,.173],[center.x-sign*.006,center.y,center.z],rubber);root.updateMatrixWorld(true);root.getObjectByName('UnifiedDoorPivot_'+(sign>0?'LF':'RF')).attach(pocket);doorGroups.push(pocket);
   }
   // Recess the black throat; body-colored returns wrap the opening.
   const throat=root.getObjectByName('air_curtain_'+side);if(throat)throat.traverse(o=>{if(!o.isMesh)return;repaired.push([o,o.geometry,o.material]);const g=o.geometry.clone(),p=g.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,p.getZ(i)-.065);g.computeVertexNormals();g.computeBoundingSphere();o.geometry=g;geometries.add(g);});
   for(let k=0;k<4;k++){const n=root.getObjectByName('front_air_cavity_'+side+'_'+k);if(!n)continue;n.traverse(o=>{if(!o.isMesh)return;repaired.push([o,o.geometry,o.material]);const g=o.geometry.clone(),p=g.attributes.position;g.computeBoundingBox();const b=g.boundingBox;for(let i=0;i<p.count;i++){const depth=Math.floor(i/49)/8,u=(i%49)/48,blend=1-depth,t=T.MathUtils.clamp((p.getY(i)-.245)/.495,0,1);p.setZ(i,p.getZ(i)-.065*depth);p.setX(i,p.getX(i)+sign*.008*blend*(k===1?1:k===3?-1:k===0?2*u-1:1-2*u));p.setY(i,p.getY(i)+.008*blend*(k===0?-1:k===2?1:2*t-1));}g.computeVertexNormals();g.computeBoundingSphere();o.geometry=g;geometries.add(g);const body=root.getObjectByName('body_shell');if(body){const donor=body.isMesh?body:body.children.find(c=>c.isMesh);if(donor){const painted=donor.material.clone();painted.side=T.DoubleSide;materials.add(painted);o.material=painted;o.onBeforeRender=()=>{painted.color.copy(donor.material.color);};}}});}
  }
 }
 if(enhance){
  root.traverse(o=>{if(!o.isMesh)return;const replace=silver?/^(DoorInnerPanel_|RecoveredDoorLining_|Preview(?:Seat|Headrest|Console|Dashboard|FrontInnerLiner|SteeringWheel)|FrontSeatPedestal_|RearSeat(?:Base|Back|Headrest|Pedestal)_|DoorArmrest_|DoorPocket_)/.test(o.name):/^(seat_(driver|passenger)_|cabin_floor$|dashboard$|center_console$|steering_(wheel|hub)$)/.test(o.name);if(replace){hidden.push([o,o.visible]);o.visible=false;}});
  const floorY=silver?.435:.155,seatY=silver?.68:.255,frontZ=silver?.3:-.10,dx=silver?.44:.43,driver=dx;
  box('CabinFloor',[silver?1.62:1.57,.035,silver?2.63:1.98],[0,floorY-.019,silver?-.16:-.12],carpet);
  seat('DriverSeat',driver,frontZ,seatY);seat('PassengerSeat',-driver,frontZ,seatY);
  if(silver){seat('RearLeftSeat',-.45,-.79,.68,.51);seat('RearRightSeat',.45,-.79,.68,.51);box('RearCenterSeat',[.35,.13,.59],[0,.68,-.79],leather);box('RearCenterBack',[.35,.59,.12],[0,1.04,-1.05],leather);box('RearCenterHeadrest',[.24,.15,.10],[0,1.48,-1.09],leather);box('CargoDeck',[1.42,.045,.50],[0,.50,-1.43],carpet);box('RearBulkhead',[1.5,.53,.04],[0,.70,-1.30],dark);}
  const dashY=silver?1.105:.78,dashZ=silver?1.02:.79;
  box('DashboardTop',[silver?1.56:1.49,.14,.28],[0,dashY,dashZ],dark);box('DashboardFascia',[silver?1.5:1.43,.115,.055],[0,dashY-.04,dashZ-.16],leather);box('DashboardAccent',[silver?1.45:1.38,.008,.012],[0,dashY-.07,dashZ-.194],metal);
  for(const x of[-.63,-.22,.22,.63]){box('AirVent',[.17,.034,.015],[x,dashY+.005,dashZ-.176],rubber);for(let i=0;i<4;i++)box('VentFin',[.14,.002,.014],[x,dashY-.006+i*.008,dashZ-.186],metal);}
  display('InstrumentDisplay',.27,.105,[driver,dashY+.065,dashZ-.18],true);display('CenterDisplay',silver?.34:.28,silver?.18:.14,[0,dashY+.075,dashZ-.195]);
  const wheelY=silver?1.015:.805,wheelZ=silver?.65:.46,wg=new T.Group();wg.name='InteriorV1_SteeringAssembly';wg.position.set(driver,wheelY,wheelZ);wg.rotation.x=-.2;added.add(wg);add(new T.TorusGeometry(.139,.015,12,56),dark,'SteeringRim',[0,0,0],wg);box('SteeringAirbag',[.085,.065,.037],[0,-.005,-.004],dark,wg);
  for(const s of[-1,1])box('SteeringSpoke',[.09,.017,.018],[s*.075,0,0],metal,wg);const bottom=box('SteeringLowerSpoke',[.019,.1,.018],[0,-.075,0],dark,wg);const col=add(new T.CylinderGeometry(.029,.034,.24,16),dark,'SteeringColumn',[driver,wheelY+.045,wheelZ+.125]);col.rotation.x=Math.PI/2-.2;
  const consoleY=silver?.67:.35;box('ConsoleBody',[.24,silver?.34:.22,.79],[0,consoleY,frontZ+.16],dark);box('Armrest',[.26,.065,.30],[0,consoleY+(silver?.20:.14),frontZ-.11],leather);box('ConsoleDeck',[.225,.027,.27],[0,consoleY+(silver?.18:.12),frontZ+.38],metal);
  for(const x of[-.055,.055]){const cup=add(new T.TorusGeometry(.039,.007,8,32),dark,'CupHolder',[x,consoleY+(silver?.20:.14),frontZ+.26]);cup.rotation.x=Math.PI/2;add(new T.CylinderGeometry(.034,.034,.01,24),rubber,'CupWell',[x,consoleY+(silver?.195:.135),frontZ+.26]);}
  box('DriveSelector',[.045,.045,.075],[0,consoleY+(silver?.22:.16),frontZ+.44],dark);
  box('FrontBulkhead',[silver?1.54:1.47,silver?.67:.45,.04],[0,silver?.77:.52,silver?1.19:.96],dark);
  for(const x of[-dx,dx])box('FootwellMat',[.49,.009,.58],[x,floorY+.006,frontZ+.57],rubber);for(const x of[driver-.065,driver+.065]){const pedal=box('Pedal',[.055,.09,.025],[x,floorY+.13,frontZ+.78],metal);pedal.rotation.x=-.38;}
  box('CabinRearWall',[silver?1.48:1.43,silver?.5:.73,.035],[0,silver?.71:.66,silver?-1.3:-.98],dark);
  for(const sign of[-1,1]){box('SillTrim',[.065,.055,silver?2.1:1.4],[sign*(silver?.82:.82),silver?.495:.22,silver?-.08:.06],dark);}
  // Upholstered trim follows the same real pivots used by mouse picking and menu controls.
  for(const {id}of doors.items){const sign=id.startsWith('L')?1:-1,front=id.endsWith('F'),pivot=root.getObjectByName((sports?'UnifiedDoorPivot_':'DoorPivot_')+id);if(!pivot)throw Error('缺少内门板安装节点 '+id);const dg=new T.Group();dg.name='InteriorV1_DoorTrim_'+id;added.add(dg);const z=sports?.09:front?.48:-.63,armY=sports?.65:.91,x=sign*(sports?.86:.84),length=sports?.76:front?.75:.58;
   root.updateMatrixWorld(true);const samples=[];pivot.traverse(o=>{if(!o.isMesh||!(/body_shell_door|DoorExterior_|DoorRecovered_/.test(o.name)))return;const p=o.geometry.attributes.position,n=o.geometry.attributes.normal;for(let i=0;i<p.count;i++){const v=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);root.worldToLocal(v);if(sign*v.x>.55&&(!n||sign*n.getX(i)>.15))samples.push(v);}});
   if(!samples.length)throw Error('无法核实内门板与门皮的间隙 '+id);
   const surface=(y,z)=>{let best=Infinity,x=0;for(const p of samples){const d=(p.y-y)**2+(p.z-z)**2;if(d<best){best=d;x=sign*p.x;}}return x;};
   // Independent molded inner trim, not an offset copy of scanned exterior triangles.
   const trimX=y=>(front?.78:.88)+(front?.15:.065)*T.MathUtils.smoothstep(y,.50,1.19);
   if(silver){
    const vertices=[],indices=[],nu=24,nv=24,outline=[];
    for(let j=0;j<=nv;j++){const y=.51+.685*j/nv,near=samples.filter(p=>Math.abs(p.y-y)<.025);if(near.length<2)throw Error('缺少门内板边缘样本 '+id);outline.push([Math.min(...near.map(p=>p.z))+.025,Math.max(...near.map(p=>p.z))-.025]);}
    // Smooth measured border samples, without reproducing individual scanned wrinkles.
    for(let pass=0;pass<3;pass++){const copy=outline.map(v=>v.slice());for(let j=1;j<nv;j++)for(let k=0;k<2;k++)outline[j][k]=(copy[j-1][k]+2*copy[j][k]+copy[j+1][k])/4;}
    for(let side=0;side<2;side++)for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){
     const v=j/nv,u=i/nu,y=.51+.685*v;
     const back=outline[j][0],ahead=outline[j][1];
     const z=T.MathUtils.lerp(back,ahead,u),recess=.012*Math.sin(Math.PI*u)**2*Math.sin(Math.PI*v)**2;
     vertices.push(sign*(trimX(y)+recess+side*.022),y,z);
    }
    const count=(nu+1)*(nv+1);
    for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=j*(nu+1)+i,b=a+1,c=a+nu+1,d=c+1;indices.push(a,c,b,b,c,d,a+count,b+count,c+count,b+count,d+count,c+count);}
    const edge=[];for(let i=0;i<=nu;i++)edge.push(i);for(let j=1;j<=nv;j++)edge.push(j*(nu+1)+nu);for(let i=nu-1;i>=0;i--)edge.push(nv*(nu+1)+i);for(let j=nv-1;j>0;j--)edge.push(j*(nu+1));
    for(let i=0;i<edge.length;i++){const a=edge[i],b=edge[(i+1)%edge.length];indices.push(a,b,a+count,b,b+count,a+count);}
    if(sign>0)for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();
    const panel=add(g,leather,'MoldedDoorPanel_'+id,[0,0,0],dg);panel.userData.independentDoorPanel=true;
    // Close the cavity between the molded trim back edge and its own door skin.
    // Endpoints come from triangle ray intersections in the closed root frame.
    const skinMeshes=[];pivot.traverse(o=>{if(o.isMesh&&/body_shell_door|DoorExterior_|DoorRecovered_/.test(o.name))skinMeshes.push(o);});
    const rv=[],ri=[],joins=[];const ray=new T.Raycaster();
    for(const index of edge){
     const base=new T.Vector3().fromArray(vertices,(index+count)*3);
     const origin=root.localToWorld(new T.Vector3(sign*2,base.y,base.z));
     const direction=new T.Vector3(-sign,0,0).transformDirection(root.matrixWorld);
     ray.set(origin,direction);const hits=ray.intersectObjects(skinMeshes,false);
     const hit=hits.find(h=>sign*root.worldToLocal(h.point.clone()).x>sign*base.x);
     let end,skinName;
     if(hit){end=root.worldToLocal(hit.point.clone());skinName=hit.object.name;}
     else {
      // Rounded rear cutouts may not lie under an axial ray. Join to the nearest
      // actual skin triangle instead of inventing an offset or leaving a hole.
      const target=new T.Vector3(sign*surface(base.y,base.z),base.y,base.z),triangle=new T.Triangle(),point=new T.Vector3();let best=Infinity;
      for(const mesh of skinMeshes){const pos=mesh.geometry.attributes.position,idx=mesh.geometry.index,matrix=root.matrixWorld.clone().invert().multiply(mesh.matrixWorld);for(let f=0;f<(idx?idx.count:pos.count);f+=3){for(const [j,v]of [[0,triangle.a],[1,triangle.b],[2,triangle.c]])v.fromBufferAttribute(pos,idx?idx.getX(f+j):f+j).applyMatrix4(matrix);if(Math.max(sign*triangle.a.x,sign*triangle.b.x,sign*triangle.c.x)<sign*base.x)continue;triangle.closestPointToPoint(target,point);const d=point.distanceToSquared(target);if(d<best){best=d;end=point.clone();skinName=mesh.name;}}}
      if(!end||Math.abs(end.y-base.y)>.06||Math.abs(end.z-base.z)>.06)throw Error('门板边缘超出可收口范围 '+id+' '+index);
     }
     joins.push({inner:base.toArray(),outer:end.toArray(),skin:skinName});
     for(let k=0;k<=4;k++){const p=base.clone().lerp(end,k/4);rv.push(p.x,p.y,p.z);}
    }
    for(let i=0;i<edge.length;i++)for(let k=0;k<4;k++){const a=i*5+k,b=((i+1)%edge.length)*5+k;ri.push(a,b,a+1,b,b+1,a+1);}
    if(sign>0)for(let i=0;i<ri.length;i+=3)[ri[i+1],ri[i+2]]=[ri[i+2],ri[i+1]];
    const returnGeometry=new T.BufferGeometry();returnGeometry.setAttribute('position',new T.Float32BufferAttribute(rv,3));returnGeometry.setIndex(ri);returnGeometry.computeVertexNormals();
    const shellReturn=add(returnGeometry,dark,'DoorPanelReturn_'+id,[0,0,0],dg);shellReturn.userData.independentDoorPanel=true;shellReturn.userData.joins=joins;

   }
   box('DoorArmrest_'+id,[.105,.055,length],[x,armY,z],leather,dg);box('DoorPull_'+id,[.035,.025,.19],[x-sign*.025,armY+.05,z+.12],metal,dg);box('DoorWindowSwitch_'+id,[.045,.01,.07],[x-sign*.03,armY+.034,z+.24],dark,dg);box('DoorPocket_'+id,[.055,.105,length*.74],[x,armY-.21,z],dark,dg);
   const speaker=add(new T.CylinderGeometry(.075,.075,.01,32),rubber,'DoorSpeaker_'+id,[x-sign*.012,armY-.17,z+.29],dg);speaker.rotation.z=Math.PI/2;const ring=add(new T.TorusGeometry(.076,.0025,5,32),metal,'SpeakerRing_'+id,[x-sign*.018,armY-.17,z+.29],dg);ring.rotation.y=Math.PI/2;
   for(let i=0;i<5;i++)box('SpeakerSlat_'+id,[.006,.003,.11],[x-sign*.02,armY-.195+i*.012,z+.29],metal,dg);
   // Fit every trim part inside the real closed-door skin, including curved lower areas.
   dg.traverse(o=>{if(!o.isMesh||o.userData.independentDoorPanel)return;const b=new T.Box3().setFromObject(o),a=root.worldToLocal(b.min.clone()),bmax=root.worldToLocal(b.max.clone());let outer=Infinity;for(const y of[a.y,(a.y+bmax.y)/2,bmax.y])for(const z of[a.z,(a.z+bmax.z)/2,bmax.z])outer=Math.min(outer,(silver?trimX(y):surface(y,z)));const face=Math.max(sign*a.x,sign*bmax.x);o.position.x+=sign*(outer-(silver?.006:.035)-face);o.userData.doorSkinClearance=.035;});
   root.updateMatrixWorld(true);pivot.attach(dg);doorGroups.push(dg);
  }
 }
 const controls=r.controls,base={fov:r.camera.fov,near:r.camera.near,min:controls.minDistance,max:controls.maxDistance,polar:controls.maxPolarAngle};let view=null;
 const render=()=>{r.camera.updateMatrixWorld();r.renderer.shadowMap.needsUpdate=true;if(r.performanceController)r.performanceController.invalidate();else r.renderer.render(r.scene,r.camera);};
 function exit(){if(!view)return;view=null;controls.minDistance=base.min;controls.maxDistance=base.max;controls.maxPolarAngle=base.polar;r.camera.fov=base.fov;r.camera.near=base.near;r.camera.updateProjectionMatrix();}
 function validate(v){if(v!==null&&v!==undefined&&!['driver','cabin'].includes(v))throw Error('内饰视角与车型不匹配');}
 function select(id){validate(id);view=id;controls.autoRotate=false;controls.enabled=true;const damping=controls.enableDamping;controls.enableDamping=false;controls.minDistance=.08;controls.maxDistance=5;controls.maxPolarAngle=Math.PI*.97;controls.update();
  if(caseId==='suv-restyle')r.selectViewInstant(id==='driver'?'cockpit':'cabin');else{const driver=silver?.44:.43,pos=id==='driver'?[driver,silver?1.31:.99,silver?.20:-.27]:silver?[.24,1.27,-.72]:[-.43,1.01,-.18],target=id==='driver'?[driver*.35,silver?1.10:.86,silver?1.04:.83]:silver?[0,1.03,.86]:[.02,.84,.78];r.camera.position.set(...pos);controls.target.set(...target);r.camera.fov=65;r.camera.near=.015;r.camera.zoom=1;r.camera.updateProjectionMatrix();controls.update();}
  controls.enableDamping=damping;render();
 }
 const report={caseId,source,enhanced:enhance,recipeVersion:2,hiddenStructure:'Inferred presentation cabin, using accepted full-size SUV component hierarchy; not claimed as a reference-exact interior.',replaced:hidden.map(([o])=>o.name),added:[]};root.traverse(o=>{if(o.isMesh&&o.name.startsWith('InteriorV1_'))report.added.push(o.name);});
 function restoreView(id,native){select(id);const p=Array.isArray(native.camera)?native.camera:native.camera?.position,t=native.target||native.camera?.target;if(p&&t){const damping=controls.enableDamping;controls.enableDamping=false;r.camera.position.fromArray(p);controls.target.fromArray(t);controls.update();controls.enableDamping=damping;render();}}
 return {select,restoreView,exit,validate,get active(){return !!view;},get view(){return view;},report,dispose(){exit();for(const [o,g,m]of repaired){o.geometry=g;o.material=m;o.onBeforeRender=()=>{};}for(const[o,visible]of hidden)o.visible=visible;for(const g of doorGroups)g.removeFromParent();added.removeFromParent();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();}};
}
