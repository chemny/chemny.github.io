import {sportsDoorRecipes} from './sports-door-recipes.js';
// Split triangles, retaining their original surfaces and interpolated normal/UV fields.
// Each rejected fragment remains on the fixed body; each accepted fragment belongs to a real hinge.
export function assembleSportsDoors(r,source){
 const T=r.T,root=r.root,recipe=sportsDoorRecipes[source],records=[],pivots={},audit=[];
 if(!recipe||root.userData.spec_sha256!==recipe.spec_sha256)throw Error('车门装配与当前模型版本不匹配');
 const at=(rows,y)=>{let i=0;while(i<rows.length-2&&y>rows[i+1][0])i++;if(y<=rows[0][0])return rows[0][1];if(y>=rows.at(-1)[0])return rows.at(-1)[1];const a=rows[i],b=rows[i+1];return a[1]+(b[1]-a[1])*(y-a[0])/(b[0]-a[0]);};
 const render=()=>r.performanceController?.invalidate()||r.renderer.render(r.scene,r.camera);
 const originals=new Map();root.traverse(o=>{if(o.isMesh)originals.set(o,{geometry:o.geometry,parent:o.parent,matrix:o.matrix.clone()});});
 const interpolate=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
 function split(poly,distance){const inside=[],outside=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],da=distance(a),db=distance(b);(da>=0?inside:outside).push(a);if((da>=0)!==(db>=0)){const p=interpolate(a,b,da/(da-db));inside.push(p);outside.push(p);}}return [inside,outside];}
 const append=(out,poly)=>{for(let i=1;i<poly.length-1;i++)for(const p of [poly[0],poly[i],poly[i+1]])out.push(...p);};
 function geometry(values,stride,attrs){const g=new T.BufferGeometry();for(const[name,size,offset]of attrs){const a=new Float32Array(values.length/stride*size);for(let i=0,j=0;i<values.length;i+=stride)for(let k=0;k<size;k++)a[j++]=values[i+offset+k];g.setAttribute(name,new T.Float32BufferAttribute(a,size));}g.computeBoundingSphere();return g;}
 function cut(mesh,sign,glass,pivot){
  const base=mesh.geometry,attrs=[];let stride=0;for(const name of ['position','normal','uv','uv1'])if(base.attributes[name]){const size=base.attributes[name].itemSize;attrs.push([name,size,stride]);stride+=size;}
  const src=base.attributes.position,index=base.index,inside=[],outside=[];
  const distances=glass?[p=>sign*p[0]-.35,p=>p[1]-1.05,p=>p[2]-recipe.glass_rear,p=>recipe.glass_front-recipe.glass_slope*Math.max(0,p[1]-recipe.belt)-p[2]]:[p=>sign*p[0]-.55,p=>p[1]-recipe.bottom,p=>recipe.belt-p[1],p=>at(recipe.front,p[1])-p[2],p=>p[2]-at(recipe.rear,p[1])];
  for(let i=0;i<(index?.count||src.count);i+=3){let poly=[];for(let k=0;k<3;k++){const n=index?index.getX(i+k):i+k,p=[];for(const[name,size]of attrs){const a=base.attributes[name];for(let j=0;j<size;j++)p.push(a.array[n*size+j]);}poly.push(p);}
   // Reject wholly outside triangles before allocating clipping fragments.
   if(distances.some(f=>poly.every(p=>f(p)<0))){append(outside,poly);continue;}
   for(const f of distances){const parts=split(poly,f);append(outside,parts[1]);poly=parts[0];if(poly.length<3)break;}if(poly.length>=3)append(inside,poly);
  }
  if(!inside.length)return;
  const fixed=geometry(outside,stride,attrs),moving=geometry(inside,stride,attrs);mesh.geometry=fixed;
  const door=new T.Mesh(moving,mesh.material);door.name=mesh.name+'_door';door.castShadow=mesh.castShadow;door.receiveShadow=mesh.receiveShadow;door.userData.doorId=sign>0?'LF':'RF';pivot.add(door);door.position.copy(pivot.position).multiplyScalar(-1);
  records.push({mesh,base,fixed,moving,door});audit.push({mesh:mesh.name,sign,sourceTriangles:(index?.count||src.count)/3,fixedTriangles:outside.length/stride/3,doorTriangles:inside.length/stride/3});
  if(!glass&&mesh.name.startsWith('body_shell')){
   const inner=new T.Mesh(moving,new T.MeshStandardMaterial({color:0x202024,roughness:.85,side:T.BackSide}));inner.name='InferredDoorInner_'+sign;inner.position.copy(door.position);inner.position.x-=sign*.025;pivot.add(inner);
   // Seal only the open cut perimeter, avoiding duplicate edges between triangles.
   const edges=new Map(),p=moving.attributes.position;const key=v=>v.map(n=>Math.round(n*1e5)).join(',');
   for(let i=0;i<p.count;i+=3)for(let k=0;k<3;k++){const a=[p.getX(i+k),p.getY(i+k),p.getZ(i+k)],j=i+(k+1)%3,b=[p.getX(j),p.getY(j),p.getZ(j)],id=[key(a),key(b)].sort().join('|');const e=edges.get(id);if(e)e.count++;else edges.set(id,{a,b,count:1});}
   const wall=[];for(const{a,b,count}of edges.values())if(count===1){const c=[b[0]-sign*.025,b[1],b[2]],d=[a[0]-sign*.025,a[1],a[2]];for(const v of[a,b,c,a,c,d])wall.push(...v);}
   const wg=new T.BufferGeometry();wg.setAttribute('position',new T.Float32BufferAttribute(wall,3));wg.computeVertexNormals();const wm=new T.Mesh(wg,new T.MeshStandardMaterial({color:0x202024,roughness:.7,side:T.DoubleSide}));wm.name='InferredDoorEdge_'+sign;wm.position.copy(door.position);pivot.add(wm);
  }
 }
 for(const[side,sign,id]of [['left',1,'LF'],['right',-1,'RF']]){
  const pivot=new T.Group();pivot.name='UnifiedDoorPivot_'+id;pivot.userData.doorId=id;pivot.position.set(sign*.9,.65,Math.max(...recipe.front.map(p=>p[1]))+.015);root.add(pivot);pivots[id]=pivot;
  // Take a snapshot: newly created moving meshes must never be cut a second time.
  const meshes=[];root.traverse(o=>{if(o.isMesh&&originals.has(o)&&(o.name==='body_shell'||o.name===`side_glass_${side}`||o.name===`door_liner_${side==='left'?'driver':'passenger'}`))meshes.push(o);});
  for(const mesh of meshes)cut(mesh,sign,mesh.name.startsWith('side_glass'),pivot);
  for(const name of [`handle_${side}`,`mirror_stem_${side}`,`mirror_pod_${side}`,`mirror_base_${side}`,`mirror_glass_${side}`,`door_${side}_front_seam`,`door_${side}_rear_seam`,`door_${side}_bottom_seam`]){const node=root.getObjectByName(name);if(node){root.updateMatrixWorld(true);pivot.attach(node);node.userData.doorId=id;}}
 }
 return {pivots,audit,recipe,render,materialBindings:records,dispose(){for(const {mesh,base,fixed,moving}of [...records].reverse()){mesh.geometry=base;fixed.dispose();moving.dispose();}for(const pivot of Object.values(pivots)){pivot.traverse(o=>{if(o.name.startsWith('InferredDoor')){if(o.name.startsWith('InferredDoorEdge'))o.geometry.dispose();o.material.dispose();}});pivot.removeFromParent();}}};
}
