import {initAreaLights} from './vendor/area-light-init.js';
// Authored presentation stages. Main-view geometry never contains softbox cards.
// All stage directions are in world space; the car and camera may orbit independently.
export function createPresentation(T,renderer,scene,{objectBounds=null,stageDistance=0}={}){
  const ids=['light','architecture','dark'];
  const exposure=1.06; // Modest shared lift; keep key-light contrast and scene identities.
  const cache=new Map();
  const pmrem=new T.PMREMGenerator(renderer);pmrem.compileCubemapShader();
  const V=(x,y,z)=>new T.Vector3(x,y,z);
  const noise=`float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);} float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);} float lineAA(float p,float period,float halfWidth){float d=abs(mod(p+period*.5,period)-period*.5);return 1.-smoothstep(halfWidth,halfWidth+max(fwidth(p),.0001),d);}`;
  function procedural(color,kind,{roughness=.88,metalness=0,basic=false}={}){
    const mat=basic?new T.MeshBasicMaterial({color,side:T.DoubleSide}):new T.MeshStandardMaterial({color,roughness,metalness,side:T.DoubleSide});
    mat.onBeforeCompile=s=>{
      s.vertexShader='varying vec3 stageWorld;\n'+s.vertexShader;
      s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nstageWorld=(modelMatrix*vec4(transformed,1.)).xyz;');
      s.fragmentShader='varying vec3 stageWorld;\n'+noise+'\n'+s.fragmentShader;
      let code='';
      if(kind==='studioWall')code=`float h=clamp(stageWorld.y/22.,0.,1.); float az=atan(stageWorld.z,stageWorld.x);diffuseColor.rgb*=mix(1.12,.63,smoothstep(0.,1.,h))*(.97+.035*cos(az-.8));`;
      if(kind==='studioFloor')code=`float rad=length(stageWorld.xz); float fall=1.-smoothstep(2.,20.,rad);float horizonBlend=smoothstep(12.,52.,rad);diffuseColor.rgb*=.98+.35*horizonBlend+.014*(noise(stageWorld.xz*2.)-.5);`;
      if(kind==='concreteWall')code=`vec2 uv=abs(stageWorld.x)>53.?stageWorld.zy:stageWorld.xy;float grain=noise(uv*55.)*.55+noise(uv*9.)*.30+noise(uv*1.1)*.15;float seams=max(lineAA(uv.x,6.,.014),lineAA(uv.y,4.,.012));float h=clamp(stageWorld.y/30.,0.,1.);diffuseColor.rgb*=mix(1.045,.78,h)+.055*(grain-.5)-.12*seams;`;
      if(kind==='concreteFloor')code=`vec2 uv=stageWorld.xz;float seams=max(lineAA(uv.x,3.,.008),lineAA(uv.y,3.,.008));float grain=noise(uv*40.)*.6+noise(uv*4.)*.4;diffuseColor.rgb*=.97+.04*(grain-.5)-.14*seams;`;
      if(kind==='darkWall')code=`float h=clamp(stageWorld.y/25.,0.,1.);float a=atan(stageWorld.z,stageWorld.x);float panel=lineAA(a*55.,8.,.024);diffuseColor.rgb*=mix(1.22,.46,h)-.18*panel+.025*noise(stageWorld.xy*12.);`;
      if(kind==='darkFloor')code=`float rad=length(stageWorld.xz);float pool=1.-smoothstep(2.,17.,rad);float seams=max(lineAA(stageWorld.x,6.,.009),lineAA(stageWorld.z,6.,.009));diffuseColor.rgb*=.83+.28*pool-.05*seams+.012*(noise(stageWorld.xz*7.)-.5);`;
      s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n'+code);
      if(kind==='studioFloor'&&scene.userData.vehicleSoftLightingScenes?.includes('light'))s.fragmentShader=s.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n totalEmissiveRadiance+=diffuseColor.rgb*.55*smoothstep(8.,24.,length(stageWorld.xz));');
    };
    mat.customProgramCacheKey=()=>`sports-stage-v1-${kind}-${kind==='studioFloor'&&scene.userData.vehicleSoftLightingScenes?.includes('light')?'soft-floor':'base'}`;
    return mat;
  }
  function object(g,mat,name,parent){const m=new T.Mesh(g,mat);m.name=name;parent.add(m);return m;}
  function cyclorama(parent,mat){
    const positions=[],indices=[],rings=[];const segments=128;
    // Eight metre tangent-continuous sweep joins the ground and vertical backdrop.
    for(let j=0;j<=24;j++){const a=j/24*Math.PI/2;rings.push([52+8*Math.sin(a),-.02+8*(1-Math.cos(a))]);}
    rings.push([60,52]);
    for(const[r,y]of rings)for(let k=0;k<=segments;k++){const a=k/segments*Math.PI*2;positions.push(r*Math.cos(a),y,r*Math.sin(a));}
    for(let j=0;j<rings.length-1;j++)for(let k=0;k<segments;k++){const a=j*(segments+1)+k,b=a+segments+1;indices.push(a,b,a+1,a+1,b,b+1);}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return object(g,mat,'continuous_cyclorama',parent);
  }
  function box(parent,name,size,pos,mat){const m=object(new T.BoxGeometry(...size),mat,name,parent);m.position.set(...pos);return m;}
  function areaCard(parent,name,pos,size,color,intensity,target){
    const m=object(new T.PlaneGeometry(...size),new T.MeshBasicMaterial({color:new T.Color(color).multiplyScalar(intensity),side:T.DoubleSide,toneMapped:false}),name,parent);m.position.set(...pos);m.lookAt(...target);m.userData.environmentOnly=true;return m;
  }
  function softbox(parent,name,pos,size,strength,target){
    const m=areaCard(parent,name,pos,size,'#ffffff',strength,target);
    m.material.onBeforeCompile=shader=>{
      shader.vertexShader='varying vec2 softboxUV;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nsoftboxUV=uv;');
      shader.fragmentShader='varying vec2 softboxUV;\n'+shader.fragmentShader;
      // A feathered diffuser has a smooth luminance boundary in reflections;
      // no hard rectangle is ever inserted into a camera-visible render.
      shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
        vec2 edge=abs(softboxUV-.5)*2.;
        float feather=(1.-smoothstep(.58,1.,edge.x))*(1.-smoothstep(.58,1.,edge.y));
        diffuseColor.rgb*=.12+.88*feather*(.82+.18*softboxUV.y);`);
    };
    m.material.customProgramCacheKey=()=> 'feathered-reflection-diffuser-v2';
    return m;
  }
  function directional(parent,name,color,power,pos,target,shadow=false){
    const l=new T.DirectionalLight(color,power);l.name=name;l.position.set(...pos);l.target.position.set(...target);parent.add(l,l.target);
    if(shadow){l.castShadow=true;l.shadow.mapSize.set(1024,1024);Object.assign(l.shadow.camera,{left:-6,right:6,top:6,bottom:-6,near:.1,far:80});l.shadow.bias=-.00012;l.shadow.normalBias=.018;l.shadow.radius=5;l.shadow.camera.updateProjectionMatrix();}
    return l;
  }
  function build(id){
    const stage=new T.Group();stage.name=`sports_presentation_${id}`;
    const background=new T.Color(id==='dark'?'#171a1d':id==='architecture'?'#e7e4dd':'#e8e8e5');
    const floor=object(new T.PlaneGeometry(160,160),procedural(id==='dark'?'#1b1e20':id==='architecture'?'#b8b5ad':'#bfc0bd',id==='dark'?'darkFloor':id==='architecture'?'concreteFloor':'studioFloor',{roughness:id==='dark'?.84:.86}),'stage_ground',stage);if(objectBounds){floor.material.side=T.FrontSide;}floor.rotation.x=-Math.PI/2;floor.position.y=-.018;floor.receiveShadow=true;
    if(id==='architecture'){
      const wallMat=procedural('#e4dfd3','concreteWall',{basic:true});
      box(stage,'north_concrete_wall',[108,52,.3],[0,25.98,-54],wallMat);
      box(stage,'south_concrete_wall',[108,52,.3],[0,25.98,54],wallMat);
      box(stage,'east_concrete_wall',[.3,52,108],[54,25.98,0],wallMat);
      box(stage,'west_concrete_wall',[.3,52,108],[-54,25.98,0],wallMat);
      // Recessed architectural pilasters give genuine perspective at every azimuth.
      const columnMat=new T.MeshBasicMaterial({color:'#c9c4b9'});
      for(const s of[-1,1])for(const x of[-36,-18,0,18,36]){box(stage,`architectural_reveal_${s}_${x}`,[.09,52,.08],[x,25.98,s*53.79],columnMat);box(stage,`architectural_reveal_side_${s}_${x}`,[.08,52,.09],[s*53.79,25.98,x],columnMat);}
    }else{
      cyclorama(stage,procedural(id==='dark'?'#252a2e':'#eeefec',id==='dark'?'darkWall':'studioWall',{basic:true}));
      if(id==='dark'){
        const archMat=new T.MeshBasicMaterial({color:'#24282c'});
        for(let i=0;i<20;i++){const a=i/20*Math.PI*2;const m=box(stage,`showroom_architectural_reveal_${i}`,[.08,44,.14],[59.65*Math.cos(a),30,59.65*Math.sin(a)],archMat);m.rotation.y=-a;}
      }
    }
    // A solid ceiling prevents an open shell at extreme upward viewing angles.
    const ceiling=object(new T.CircleGeometry(id==='architecture'?79:61,96),new T.MeshBasicMaterial({color:id==='dark'?'#15181a':'#c6c7c3',side:T.DoubleSide}),'architectural_ceiling',stage);ceiling.rotation.x=Math.PI/2;ceiling.position.y=51.9;
    const hemi=new T.HemisphereLight(id==='dark'?'#e7ebef':id==='light'?'#f5f5f4':'#fffaf1',id==='dark'?'#545351':'#aaa79f',id==='dark'?.84:id==='architecture'?.78:.54);stage.add(hemi);
    // Rectangular sources exist only inside the reflection capture below.
    if(id==='light'){
      directional(stage,'studio_large_key','#fffefd',1.65,[6,9,5],[0,.6,0],true);
      directional(stage,'studio_soft_fill','#eef1f3',.32,[-7,5,-3],[0,.7,0]);
      directional(stage,'studio_rear_shape','#ffffff',.7,[-2,7,-8],[0,.9,0]);
    }else if(id==='architecture'){
      directional(stage,'courtyard_daylight','#fff7e7',2.45,[-10,13,7],[0,.5,0],true);
      directional(stage,'courtyard_sky_fill','#f0f3f5',.40,[9,7,-5],[0,.6,0]);
    }else{
      directional(stage,'showroom_top_key','#fffaf5',1.35,[-4,10,4],[0,.7,0],true);
      directional(stage,'showroom_side_rim','#f0f3f5',.8,[7,6,-7],[0,.9,0]);
      directional(stage,'showroom_front_fill','#f6f4ef',.96,[2,4,9],[0,.6,0]);
      directional(stage,'showroom_opposite_fill','#eef2f5',.64,[-8,4,-2],[0,.8,0]);
    }
    // Reflection geometry shares the visible scenery, fixed world orientation and
    // light color. Source cards are never attached to the user's main scene.
    const reflection=new T.Scene();reflection.background=background.clone();reflection.add(stage.clone(true));
    const cards=new T.Group();cards.name='reflection_only_softboxes';reflection.add(cards);
    if(id==='light'){
      softbox(cards,'key_softbox',[5.5,7,4],[5.5,4.5],5.0,[0,.65,0]);
      softbox(cards,'shoulder_diffuser',[6,3,-6],[7,3.2],3.5,[0,.7,0]);
      softbox(cards,'fill_softbox',[-7,5,-3],[4,6],1.05,[0,.6,0]);
      softbox(cards,'rear_softbox',[-1,6,-8],[10,4.5],2.8,[0,.7,0]);
    }else if(id==='architecture'){
      areaCard(cards,'courtyard_open_sky',[-10,16,7],[18,13],'#fff7e7',3.6,[0,.6,0]);
      areaCard(cards,'courtyard_sky_fill',[9,9,-5],[12,10],'#f0f3f5',1.3,[0,.6,0]);
    }else{
      softbox(cards,'overhead_diffuser',[-2,11,1],[14,9],3.2,[0,.6,0]);
      softbox(cards,'left_side_diffuser',[8,4,0],[11,5],2.4,[0,.8,0]);
      softbox(cards,'right_side_diffuser',[-8,4,0],[11,5],2.4,[0,.8,0]);
      softbox(cards,'front_fill_diffuser',[0,5,10],[11,6],2.2,[0,.6,0]);
      softbox(cards,'rear_fill_diffuser',[0,5,-10],[10,5],1.6,[0,.8,0]);
    }
    // Low horizontal black flags create the dark reflection band used in car
    // photography; these reflectors are isolated from every user-visible view.
    for(const sign of[-1,1]){
      if(id==='dark'){softbox(cards,'lower_bounce_'+sign,[sign*8,1.5,0],[12,3],.7,[0,.7,0]);continue;}
      areaCard(cards,'low_black_flag_'+sign,[sign*7,1.1,0],[11,2.2],id==='light'?'#414447':'#101214',1,[0,1.1,0]);
      areaCard(cards,'rear_black_flag_'+sign,[0,.5,sign*8],[6,1.2],'#171a1d',1,[0,.5,0]);
    }
    const environment=pmrem.fromScene(reflection,id==='light'?.075:.14,.1,180,{position:V(0,.9,0),size:256});
    if(objectBounds){
      // Size the visible stage and shadow frustum to the displayed asset.
      // Reflection capture stays in canonical coordinates; it contains no visible cards.
      const size=objectBounds.getSize(new T.Vector3()),center=objectBounds.getCenter(new T.Vector3());
      const scale=Math.max(Math.max(size.x,size.y,size.z)/5,stageDistance/15);
      stage.scale.setScalar(scale);stage.position.set(center.x,objectBounds.min.y,center.z);
      stage.traverse(o=>{if(o.isHemisphereLight)o.intensity=Math.max(o.intensity,id==='dark'?1.08:.76);if(o.isDirectionalLight&&o.castShadow){const c=o.shadow.camera;for(const k of ['left','right','top','bottom','near','far'])c[k]*=scale;c.updateProjectionMatrix();o.shadow.normalBias*=scale;}});
      stage.userData.objectScale=scale;
    }
    // Keep the capture scene out of the main graph, but retain geometry/materials
    // until teardown so shared references remain valid for scene switching.
    return{stage,background,environment,reflection,intensity:id==='dark'?.98:id==='architecture'?.68:.76};
  }
  let current=null;
  function vehicleSoftSources(entry){
    const id=entry.stage.name.replace('sports_presentation_','');
    if(!scene.userData.vehicleSoftLightingScenes?.includes(id))return;
    if(entry.stage.userData.vehicleSoftLighting){entry.vehicleSoftLighting=true;entry.environment=entry.stage.userData.vehicleEnvironment;return;}
    // Balance reflected diffusers as well as direct irradiance. This happens
    // lazily so native stages created before the vehicle policy receive it too.
    const cards=entry.reflection.getObjectByName('reflection_only_softboxes');
    if(id==='dark'){
      for(const name of ['overhead_diffuser','front_fill_diffuser']){
        const card=cards.getObjectByName(name);card.material.color.multiplyScalar(name==='overhead_diffuser'?.55:.7);card.scale.set(.8,.75,1);
      }
      for(const name of ['left_side_diffuser','right_side_diffuser']){
        const card=cards.getObjectByName(name);card.position.y=2.9;card.material.color.multiplyScalar(1.5);card.scale.set(1,.72,1);card.lookAt(0,.8,0);
      }
      for(const sign of [-1,1])cards.getObjectByName('lower_bounce_'+sign).material.color.multiplyScalar(1.8);
    }else if(id==='light'){
      cards.getObjectByName('key_softbox').material.color.multiplyScalar(.75);
      cards.getObjectByName('fill_softbox').material.color.multiplyScalar(1.2);
    }
    if(id!=='architecture'){
      entry.reflection.updateMatrixWorld(true);
      const previous=entry.environment;
      entry.environment=pmrem.fromScene(entry.reflection,id==='light'?.075:.14,.1,180,{position:V(0,.9,0),size:256});
      previous.dispose();
      const cached=cache.get(id);if(cached)cached.environment=entry.environment;
    }
    entry.stage.userData.vehicleEnvironment=entry.environment;
    initAreaLights(T);
    const specs=id==='dark'?[
      ['overhead_diffuser',[-2,12,-2],[10,6],1.35,'#fffaf5',[0,.6,0]],
      ['left_side_diffuser',[6.5,3.2,0],[9,3.5],4.0,'#f0f3f5',[0,.8,0]],
      ['right_side_diffuser',[-6.5,3.2,0],[9,3.5],4.0,'#f0f3f5',[0,.8,0]],
      ['front_fill_diffuser',[0,3.8,10],[8,4],1.55,'#f6f4ef',[0,.6,0]],
      ['rear_fill_diffuser',[0,5,-10],[10,5],1.5,'#eef2f5',[0,.8,0]]
    ]:id==='light'?[
      ['key_softbox',[6,7,2],[5,3.5],2.1,'#fffefd',[0,.65,0]],
      ['shoulder_diffuser',[6,3,-3],[8,3.2],2.5,'#ffffff',[0,.7,0]],
      ['fill_softbox',[-6.5,3.5,-2],[7,3.5],2.2,'#eef1f3',[0,.6,0]],
      ['rear_softbox',[-1,6,-8],[10,4.5],1.6,'#ffffff',[0,.7,0]]
    ]:[
      ['courtyard_open_sky',[-10,16,7],[18,13],1.8,'#fff7e7',[0,.6,0]],
      ['courtyard_sky_fill',[9,9,-5],[12,10],1.2,'#f0f3f5',[0,.6,0]]
    ];
    const powers={showroom_top_key:.35,showroom_side_rim:.22,showroom_front_fill:.14,showroom_opposite_fill:.15,studio_large_key:.50,studio_soft_fill:.10,studio_rear_shape:.20,courtyard_daylight:1.5,courtyard_sky_fill:.12};
    entry.stage.traverse(o=>{if(o.isDirectionalLight&&powers[o.name]!==undefined){o.intensity=powers[o.name];if(o.castShadow){o.shadow.radius=8;o.shadow.normalBias=.012;}}});
    for(const[name,pos,size,power,color,target]of specs){
      const light=new T.RectAreaLight(color,power,...size);light.name='area_'+name;
      // Aim before parenting: the stage may already have a vehicle-specific yaw.
      light.position.set(...pos);light.lookAt(...target);light.userData.directAreaLight=true;entry.stage.add(light);
    }
    // Analytical area lights have no shadow maps in this WebGL renderer. Retain
    // the directional cast shadow and add a soft, explicitly approximate contact
    // occlusion beneath the real vehicle footprint, rather than leaving it floating.
    const footprint=scene.userData.vehicleGroundFootprint;
    if(footprint){
      const width=Math.min(3,Math.max(1.4,footprint.width)),length=Math.min(7,Math.max(3.5,footprint.length));
      const mat=new T.ShaderMaterial({transparent:true,depthWrite:false,toneMapped:false,uniforms:{extent:{value:new T.Vector2(width,length)}},vertexShader:'varying vec2 groundUV;void main(){groundUV=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 groundUV;uniform vec2 extent;void main(){vec2 p=(groundUV-.5)*extent*1.6;vec2 b=abs(p)/(extent*vec2(.43,.40));float alpha=.34*exp(-pow(b.x,6.)-pow(b.y,6.));for(int i=0;i<2;i++){float x=(i==0?-1.:1.)*extent.x*.46;for(int j=0;j<2;j++){float z=(j==0?-1.:1.)*extent.y*.30;vec2 q=(p-vec2(x,z))/vec2(.18,.28);alpha+=.38*exp(-dot(q,q)*1.5);}}gl_FragColor=vec4(0.,0.,0.,min(.56,alpha));}'});
      const contact=object(new T.PlaneGeometry(width*1.6,length*1.6),mat,'vehicle_soft_contact_occlusion',entry.stage);
      contact.rotation.x=-Math.PI/2;contact.position.set(footprint.center[0],-.012,footprint.center[1]);contact.renderOrder=1;contact.userData.approximateContactShadow=true;
    }
    entry.vehicleSoftLighting=true;entry.stage.userData.vehicleSoftLighting=true;renderer.shadowMap.needsUpdate=true;
  }
  function orient(entry){
    const yaw=scene.userData.vehiclePresentationYaw??0;
    if(entry.stage.rotation.y!==yaw){entry.stage.rotation.y=yaw;entry.stage.updateMatrixWorld(true);renderer.shadowMap.needsUpdate=true;}
    // Rotate the canonical reflection capture with the real stage, never the model.
    scene.environmentRotation.set(0,yaw,0);
  }
  function select(id){
    if(!ids.includes(id))id='light';if(current?.id===id){vehicleSoftSources(current);orient(current);scene.background=current.background;scene.environment=current.environment.texture;scene.environmentIntensity=current.intensity*(current.vehicleSoftLighting?.72:1);scene.fog=null;renderer.toneMappingExposure=exposure;return;}
    if(current)scene.remove(current.stage);
    let entry=cache.get(id);if(!entry){entry=build(id);cache.set(id,entry);}
    vehicleSoftSources(entry);orient(entry);scene.add(entry.stage);scene.background=entry.background;scene.environment=entry.environment.texture;
    scene.environmentIntensity=entry.intensity*(entry.vehicleSoftLighting?.72:1);
    scene.fog=null;
    current={...entry,id};
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
    renderer.toneMappingExposure=exposure;
    scene.userData.presentation={id,worldFixed:true,visibleLightCards:0,lighting:id==='dark'?'top-soft-key-and-side-rim':id==='architecture'?'side-daylight-and-sky-fill':'broad-studio-key-fill-rim'};
  }
  const refreshVehicleLighting=()=>{if(!current)return;vehicleSoftSources(current);orient(current);scene.environmentIntensity=current.intensity*(current.vehicleSoftLighting?.72:1);};
  scene.userData.refreshVehicleLighting=refreshVehicleLighting;
  select('light');
  return{select,ids,dispose(){if(scene.userData.refreshVehicleLighting===refreshVehicleLighting)delete scene.userData.refreshVehicleLighting;if(current)scene.remove(current.stage);for(const e of cache.values()){e.environment.dispose();const gs=new Set(),ms=new Set();e.stage.traverse(o=>{if(o.isMesh){gs.add(o.geometry);for(const m of(Array.isArray(o.material)?o.material:[o.material]))ms.add(m);}});e.reflection.traverse(o=>{if(o.isMesh){gs.add(o.geometry);for(const m of(Array.isArray(o.material)?o.material:[o.material]))ms.add(m);}});for(const g of gs)g.dispose();for(const m of ms)m.dispose();}cache.clear();pmrem.dispose();}};
}
