import {createPresentation} from './presentation.js?v=lighting-balance-v3';
export const paints=[['default','默认颜色','#faf9f5'],['white','珍珠白','#e9e7df'],['silver','金属银','#9ca5ad'],['black','曜石黑','#161c22'],['blue','深海蓝','#163c61'],['red','赛车红','#ae1426'],['yellow','亮黄','#ffd20a']];
export const wheels=[['wide','双色宽辐'],['split','运动双五辐'],['turbine','涡轮轮毂']];
export const scenes=[['light','自然棚拍'],['architecture','浅色建筑'],['dark','深色展厅']];
export const views=[['quarter','正侧45°'],['side','车头侧面'],['rear-quarter','后侧45°'],['rear','车尾'],['top','车顶']];
// Identical spoke geometry across vehicles; fit to the existing rim, retaining tires and brakes.
function spokeGeometry(T,style){const group=new T.Group(),dark=new T.MeshStandardMaterial({color:'#30363b',metalness:.65,roughness:.32}),silver=new T.MeshStandardMaterial({color:'#ced3d7',metalness:.78,roughness:.24});
 const blade=(points,angle)=>{const shape=new T.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();const mesh=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:.045,bevelEnabled:true,bevelSize:.008,bevelThickness:.006,bevelSegments:3}),dark);mesh.rotation.z=angle;mesh.castShadow=true;group.add(mesh);const face=new T.Mesh(new T.ShapeGeometry(shape),silver);face.scale.set(.95,.86,1);face.position.z=.053;face.rotation.z=angle;group.add(face);};
 for(let i=0;i<(style==='turbine'?10:5);i++){const a=i*Math.PI*2/(style==='turbine'?10:5);if(style==='wide')blade([[.18,-.07],[.91,-.19],[.96,-.12],[.96,.12],[.24,.08]],a);else if(style==='split'){for(const s of[-1,1])blade([[.19,s*.025],[.53,s*.08],[.95,s*.23],[.96,s*.32],[.48,s*.17]],a);}else blade([[.20,-.03],[.48,-.04],[.96,.10],[.95,.27],[.65,.16],[.24,.04]],a);}
 const cap=new T.Mesh(new T.CylinderGeometry(.19,.19,.07,40),dark);cap.rotation.x=Math.PI/2;cap.position.z=.025;group.add(cap);return group;}
export function mountAppearance(r,id){const {T,root,scene,renderer}=r;root.updateMatrixWorld(true);const nativeNodes=[];const groups=[];const rims=[];
 root.traverse(o=>{if(id==='silver-suv'&&/^(Front|Rear)(Right|Left)RimLip$/.test(o.name))rims.push(o);if(id==='yellow-sports-car'&&o.isMesh&&/^wheels_split_(LF|RF|LR|RR)_lip$/.test(o.name))rims.push(o);if(id==='suv-restyle'&&o.name.startsWith('rim_lip'))rims.push(o);
 if(id==='silver-suv'&&/^(Front|Rear)(Right|Left)(SplitSpokeFace|SplitSpokes|SpokeSidewalls|CenterCap|BoltCollars)$/.test(o.name))nativeNodes.push(o);
 if(id==='suv-restyle'&&/^(wheelstyle_|hubcap|hub_badge|wheel_bolt)/.test(o.name))nativeNodes.push(o);
 if(id==='yellow-sports-car'&&/^wheels_split_\w+_(spoke_\d+|face_\d+|hub|cap|bolt_\d+)$/.test(o.name))nativeNodes.push(o);
 });
 if(rims.length!==4)throw Error('Expected four rim anchors, got '+rims.length+' for '+id);
 for(const rim of rims){const box=new T.Box3().setFromObject(rim),center=box.getCenter(new T.Vector3()),size=box.getSize(new T.Vector3()),axis=size.x<size.z?'x':'z',sign=Math.sign(center[axis]),radius=(axis==='x'?size.y:Math.max(size.x,size.y))/2;
 center[axis]=sign>0?box.max[axis]-.012:box.min[axis]+.012;
 const holder=new T.Group();holder.name='unified_wheel_'+rim.name;holder.position.copy(center);holder.rotation.y=axis==='x'?sign*Math.PI/2:sign<0?Math.PI:0;holder.scale.setScalar(radius*.94);scene.add(holder);
 for(const [style]of wheels){const mesh=spokeGeometry(T,style);mesh.name=style;holder.add(mesh);}groups.push(holder);}
 // Existing world-space stages are disabled only in the unified browser session.
 const existing=[...scene.children].filter(o=>o!==root&&!groups.includes(o)&&!o.getObjectById(root.id));for(const o of existing)o.visible=false;
 const presentation=createPresentation(T,renderer,scene);
 const defaultPaint=r.defaultPaintColor||(id==='yellow-sports-car'?'#ffd20a':id==='suv-restyle'?'#161c22':'#9ca5ad');
 const state={paint:'default',wheel:'wide',scene:'light'};
 function apply(){r.paint(state.paint==='default'?defaultPaint:paints.find(p=>p[0]===state.paint)[2]);nativeNodes.forEach(o=>o.visible=false);if(id==='yellow-sports-car'){r.root.getObjectByName('wheels_split').visible=true;for(const n of['wheels_five','wheels_turbine'])r.root.getObjectByName(n).visible=false;}groups.forEach(g=>g.children.forEach(c=>c.visible=c.name===state.wheel));presentation.select(state.scene);scene.fog=null;renderer.shadowMap.needsUpdate=true;}
 apply();return{state,apply,defaultPaint,set(key,value){const list={paint:paints,wheel:wheels,scene:scenes}[key];if(!list?.some(a=>a[0]===value))throw Error('无效选项');state[key]=value;apply();},get wheelCount(){return groups.length},presentation};
}
export function wheelPreview(T,style){const scene=new T.Scene();scene.background=new T.Color('#f2f2ef');const wheel=spokeGeometry(T,style);scene.add(wheel);const tire=new T.Mesh(new T.TorusGeometry(1.05,.12,16,64),new T.MeshStandardMaterial({color:'#171a1c',roughness:.85}));scene.add(tire);const ring=new T.Mesh(new T.TorusGeometry(.98,.025,10,64),new T.MeshStandardMaterial({color:'#abb3ba',metalness:.6,roughness:.3}));scene.add(ring);scene.add(new T.HemisphereLight(0xffffff,0x555555,2));const light=new T.DirectionalLight(0xffffff,3);light.position.set(-2,3,5);scene.add(light);const camera=new T.PerspectiveCamera(32,1,.1,20);camera.position.set(0,0,4.8);const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(144,144);renderer.render(scene,camera);const url=renderer.domElement.toDataURL();scene.traverse(o=>{o.geometry?.dispose();if(o.material)o.material.dispose();});renderer.dispose();renderer.forceContextLoss();return url;}
