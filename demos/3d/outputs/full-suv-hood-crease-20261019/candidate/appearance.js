import * as T from 'three';
export const wheelOptions=[['multi','双色宽辐','五组宽辐 · 银色切削面'],['sport','半封闭宽辐','五组厚片 · 深色缎面'],['turbine','旋转涡轮','十片弧形叶片 · 枪灰金属']];
// Independent material recipes; no sampled screenshot highlight is baked into baseColor.
export const paints=[
 ['titanium','钛金灰','#88877e','细腻金属感 · 柔和清漆反射',{metalness:.64,roughness:.30,clearcoat:1,clearcoatRoughness:.14,envMapIntensity:1.0}],
 ['champagne','香槟金','#b2a18a','低饱和暖金 · 温润金属漆',{metalness:.60,roughness:.32,clearcoat:1,clearcoatRoughness:.17,envMapIntensity:.95}],
 ['black','曜石黑','#171b1e','深色亮面 · 清晰高光',{metalness:.36,roughness:.24,clearcoat:1,clearcoatRoughness:.10,envMapIntensity:1.08}],
 ['white','珍珠白','#e5e4dc','柔和珠光观感 · 细腻亮面',{metalness:.20,roughness:.34,clearcoat:1,clearcoatRoughness:.20,envMapIntensity:.88}],
 ['blue','雾蓝灰','#687582','低饱和冷蓝 · 缎光金属漆',{metalness:.55,roughness:.35,clearcoat:.93,clearcoatRoughness:.21,envMapIntensity:.95}],
 ['green','深墨绿','#233f37','深色金属绿 · 通透清漆层',{metalness:.48,roughness:.28,clearcoat:1,clearcoatRoughness:.13,envMapIntensity:1.0}]
];
export function applyPaint(m,id){const p=paints.find(p=>p[0]===id);if(!p)throw Error('Unknown paint');m.color.set(p[2]);Object.assign(m,p[4]);}
// Offscreen thumbnails use the same mesh, material and reflection environment as the car.
export function makeThumbnails(vehicle,environment){
 const renderer=new T.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});renderer.setSize(320,220);renderer.setPixelRatio(1);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
 const scene=new T.Scene();scene.background=new T.Color(0xffffff);scene.environment=environment;scene.add(new T.HemisphereLight(0xf3f6ff,0x797263,2));for(const [pos,intensity,color]of [[[2,6,3],4.5,0xfff8ef],[[-5,5,-4],1.7,0xe4e8eb]]){const light=new T.DirectionalLight(color,intensity);light.position.fromArray(pos);scene.add(light);}
 const camera=new T.PerspectiveCamera(33,320/220,.01,20),out={paints:{},wheels:{}};vehicle.updateMatrixWorld(true);
 let hood;vehicle.traverse(a=>{if(a.isMesh&&a.name.startsWith('hood_crowned_'))hood=a;});
 const g=hood.geometry.clone().applyMatrix4(hood.matrixWorld);g.computeBoundingBox();const c=g.boundingBox.getCenter(new T.Vector3());g.translate(-c.x,-c.y,-c.z);const m=hood.material.clone(),sample=new T.Mesh(g,m);scene.add(sample);camera.position.set(2,2.3,2.5);camera.lookAt(0,0,0);
 for(const p of paints){applyPaint(m,p[0]);renderer.render(scene,camera);out.paints[p[0]]=renderer.domElement.toDataURL('image/png');}
 scene.remove(sample);g.dispose();m.dispose();
 const group=new T.Group();scene.add(group);vehicle.traverse(a=>{if(!a.isMesh||a.userData.wheelCorner!=='front-left')return;const g=a.geometry.clone().applyMatrix4(a.matrixWorld),c=a.userData.wheelCenter;g.translate(-c[0],-c[1],-c[2]);g.scale(1/.875,1/.875,1/.875);const clone=new T.Mesh(g,a.material);clone.userData={...a.userData};group.add(clone);});
 const wheelKey=new T.DirectionalLight(0xffffff,2.5);wheelKey.position.set(-1,2,-3);scene.add(wheelKey);
 camera.position.set(.20,.14,-2.1);camera.lookAt(0,0,0);
 for(const [id]of wheelOptions){for(const a of group.children)a.visible=!a.userData.wheelVariant||a.userData.wheelVariant===id;renderer.render(scene,camera);out.wheels[id]=renderer.domElement.toDataURL('image/png');}
 for(const a of group.children)a.geometry.dispose();renderer.dispose();return out;
}
