import * as T from '/demos/3d/outputs/yellow-chick-ab-20261013/new/chosen-bundle/vendor/three.module.js';
const q=new URLSearchParams(location.search),fresh=q.get('geometry')==='new', improved=q.get('look')!=='old';
const base=q.get('variant')==='baseline'?'./baseline/':'./candidate/';
const {buildScene}=await import(base+'model.js');const config=await fetch('./capture-config.json').then(r=>r.json()),look=await fetch('./lookdev.json').then(r=>r.json());
const model=buildScene();await model.ready;const canvas=document.querySelector('canvas'),renderer=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=improved?T.NeutralToneMapping:T.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
const scene=new T.Scene();scene.add(model.root);scene.background=new T.Color(improved?look.lighting.background:'#eeeeee');
if(improved){
 const floorY=new T.Box3().setFromObject(model.root).min.y;
 const studio=new T.Scene();studio.background=new T.Color('#888888');
 for(const {position:p,size:s,radiance:k} of look.lighting.softboxes){const m=new T.Mesh(new T.PlaneGeometry(...s),new T.MeshBasicMaterial({color:new T.Color(k,k,k),side:T.DoubleSide}));m.position.set(...p);m.lookAt(0,1.6,0);studio.add(m)}
 const pmrem=new T.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(studio,.06,.1,100).texture;pmrem.dispose();
 scene.add(new T.HemisphereLight(0xffffff,0xd8cbbb,look.lighting.hemisphereIntensity));
 const key=new T.DirectionalLight(0xffffff,look.lighting.directionalIntensity);key.position.set(-3,7,5);scene.add(key);const fill=new T.DirectionalLight(0xffffff,look.lighting.fillIntensity);fill.position.set(0,1,6);scene.add(fill);
 const ground=new T.Mesh(new T.PlaneGeometry(200,200),new T.MeshBasicMaterial({color:look.lighting.background,toneMapped:false}));ground.rotation.x=-Math.PI/2;ground.position.y=floorY-.005;scene.add(ground);
 // Soft contact shadow: deterministic radial opacity under the toy; presentation only.
 const n=128,data=new Uint8Array(n*n*4);for(let y=0;y<n;y++)for(let x=0;x<n;x++){let r=((x-n/2)/(n*.38))**2+((y-n/2)/(n*.3))**2,i=(y*n+x)*4;data[i]=93;data[i+1]=72;data[i+2]=44;data[i+3]=Math.round(65*Math.exp(-r*2));}const tex=new T.DataTexture(data,n,n);tex.needsUpdate=true;const shadow=new T.Mesh(new T.PlaneGeometry(3.7,2.9),new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=floorY-.003;scene.add(shadow);
 for(const [id,m] of Object.entries(model.materials)){const p=look.materials[id];if(p){if(p.color)m.color.set(p.color);for(const k of ['roughness','metalness','clearcoat','clearcoatRoughness'])if(p[k]!==undefined)m[k]=p[k];m.envMapIntensity=p.envMapIntensity??look.lighting.environmentIntensity;}}
}else{scene.add(new T.HemisphereLight(0xffffff,0x555555,2));const l=new T.DirectionalLight(0xffffff,3);l.position.set(4,7,5);scene.add(l)}
const originals=new Map();model.root.traverse(o=>{if(o.isMesh)originals.set(o,o.material)});const gray=new T.MeshStandardMaterial({color:0x999999,roughness:.8});let camera,target;
function render(){renderer.render(scene,camera)}
function select(view='reference',mode='beauty'){const c=config.cameras[view];renderer.setSize(c.width,c.height,false);const a=c.width/c.height;camera=new T.OrthographicCamera(-c.ortho_height*a/2,c.ortho_height*a/2,c.ortho_height/2,-c.ortho_height/2,.01,100);camera.position.fromArray(c.position);target=new T.Vector3(...c.target);camera.lookAt(target);camera.updateMatrixWorld();originals.forEach((m,o)=>o.material=mode==='gray'?gray:m);render()}
document.querySelector('#view').onchange=()=>select(document.querySelector('#view').value,document.querySelector('#mode').value);document.querySelector('#mode').onchange=document.querySelector('#view').onchange;document.querySelector('#reset').onclick=()=>{model.explode(0);document.querySelector('#explode').value=0;select()};document.querySelector('#explode').oninput=e=>{model.explode(+e.target.value);render()};
let drag;canvas.onpointerdown=e=>{drag=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId)};canvas.onpointerup=canvas.onpointercancel=()=>drag=null;canvas.onpointermove=e=>{if(!drag)return;let s=new T.Spherical().setFromVector3(camera.position.clone().sub(target));s.theta-=(e.clientX-drag[0])*.006;s.phi=Math.max(.05,Math.min(Math.PI-.05,s.phi+(e.clientY-drag[1])*.006));camera.position.copy(target).add(new T.Vector3().setFromSpherical(s));camera.lookAt(target);drag=[e.clientX,e.clientY];render()};canvas.onwheel=e=>{e.preventDefault();camera.zoom=Math.max(.4,Math.min(4,camera.zoom*Math.exp(-e.deltaY*.001)));camera.updateProjectionMatrix();render()};
select('reference','beauty');document.querySelector('#status').textContent=(fresh?'构造方法试验：未通过视觉验收':'冻结旧基线')+' · 固定相机与布光';window.testView={ready:true,select,model,scene,renderer,get camera(){return camera},capture(){render();return canvas.toDataURL('image/png')}};

window.testView.T=T;
