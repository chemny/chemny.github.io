// Cached reconstruction preserves each Float32 attribute and existing material binding.
function applyPrecomputedDoors(r){
 const T=r.T,cache=r.assemblyCache,meta=cache.meta,root=r.root,sources=new Map(),originals=[],added=[],transforms=[];
 const find=name=>{const found=[];root.traverse(o=>{if(o.name===name)found.push(o)});if(found.length!==1)throw Error('装配节点不唯一 '+name);return found[0];};
 for(const item of meta.fixed){const mesh=find(item.name);sources.set(item.name,mesh.geometry);}
 const lining=new T.MeshStandardMaterial({color:'#70695e',roughness:.8,side:T.DoubleSide});
 for(const item of meta.fixed){const mesh=find(item.name),g=cache.createGeometry(T,sources,item.geometry);originals.push([mesh,mesh.geometry,g]);mesh.geometry=g;}
 for(const item of meta.hinges){const pivot=find(item.name),old=pivot.position.clone(),next=new T.Vector3().fromArray(item.next),delta=old.clone().sub(next);transforms.push([pivot,old,delta]);for(const child of pivot.children)child.position.add(delta);pivot.position.copy(next);const id=item.name.slice(-2);for(const y of [.72,1.08])for(const prefix of ['DoorHingeBracket_','DoorHingePin_']){const bracket=root.getObjectByName(prefix+id+'_'+y);if(bracket){transforms.push([bracket,bracket.position.clone(),null]);bracket.position.x+=next.x-old.x;}}}
 for(const item of meta.extras){const material=item.materialSource?find(item.materialSource).material:lining,m=new T.Mesh(cache.createGeometry(T,sources,item.geometry),material);m.name=item.name;m.position.fromArray(item.position);m.quaternion.fromArray(item.quaternion);m.scale.fromArray(item.scale);m.castShadow=!!item.materialSource;m.receiveShadow=!!item.materialSource;find(item.parent).add(m);added.push(m);}
 return {audit:meta.audit,precomputed:true,dispose(){for(const m of added){m.removeFromParent();m.geometry.dispose();}for(const[node,position,delta]of transforms){if(delta)for(const child of node.children)child.position.sub(delta);node.position.copy(position);}for(const[mesh,old,g]of originals){mesh.geometry=old;g.dispose();}lining.dispose();}};
}
// Recover rear-door surface that an older split left on the fixed body.
// Preserve all vertex fields and the closed exterior, including semantic paint coordinates.
export function repairSilverRearDoors(r){
 if(r.assemblyCache)return applyPrecomputedDoors(r);
 const T=r.T,lining=new T.MeshStandardMaterial({color:'#70695e',roughness:.8,side:T.DoubleSide}),model=r.root.getObjectByName('DoorPivot_LR').parent,rows=[[.48,-.80],[.60,-.82],[.72,-.90],[.84,-1.06],[.94,-1.23],[1.04,-1.30],[1.28,-1.30],[1.74,-1.18]],records=[],added=[],audit=[],hinges=[];
 const lerp=(a,b,t)=>a.map((x,i)=>x+(b[i]-x)*t);
 function clip(poly,f){let yes=[],no=[];for(let i=0;i<poly.length;i++){let a=poly[i],b=poly[(i+1)%poly.length],da=f(a),db=f(b);(da>=0?yes:no).push(a);if((da>=0)!==(db>=0)){let p=lerp(a,b,da/(da-db));yes.push(p);no.push(p);}}return [yes,no];}
 const append=(dest,poly)=>{for(let i=1;i<poly.length-1;i++)for(const p of [poly[0],poly[i],poly[i+1]])dest.push(...p);};
 function build(values,attrs,stride){const g=new T.BufferGeometry();for(const[name,size,offset]of attrs){const a=[];for(let i=0;i<values.length;i+=stride)for(let k=0;k<size;k++)a.push(values[i+offset+k]);g.setAttribute(name,new T.Float32BufferAttribute(a,size));}g.computeBoundingSphere();return g;}
 const meshes=[];model.traverse(o=>{if(o.isMesh&&/^RetainedExterior/.test(o.name))meshes.push(o);});
 for(const sign of [1,-1]){const id=sign>0?'LR':'RR',pivot=model.getObjectByName('DoorPivot_'+id);
  for(const mesh of meshes){const base=mesh.geometry,p=base.attributes.position,index=base.index,attrs=[];let stride=0;for(const name of ['position',...Object.keys(base.attributes).filter(n=>n!=='position')]){const a=base.attributes[name];attrs.push([name,a.itemSize,stride]);stride+=a.itemSize;}
   const fixed=[],moving=[];for(let i=0;i<(index?.count||p.count);i+=3){let poly=[];for(let j=0;j<3;j++){let v=[],k=index?index.getX(i+j):i+j;for(const[name,size]of attrs){const a=base.attributes[name];for(let q=0;q<size;q++)v.push(a.array[k*size+q]);}poly.push(v);}
    const limits=[v=>sign*v[0]-.65,v=>v[1]-.48,v=>1.74-v[1],v=>-.018-v[2],v=>v[2]+1.30];
    if(limits.some(f=>poly.every(v=>f(v)<0))){append(fixed,poly);continue;}
    for(const f of limits){const [yes,no]=clip(poly,f);append(fixed,no);poly=yes;if(poly.length<3)break;}if(poly.length<3)continue;
    for(let k=0;k<rows.length-1;k++){const [ya,za]=rows[k],[yb,zb]=rows[k+1];const [upper,slab]=clip(poly,v=>v[1]-yb);poly=upper;if(slab.length>=3){const slope=(zb-za)/(yb-ya);const[inside,outside]=clip(slab,v=>v[2]-(za+slope*(v[1]-ya)));append(moving,inside);append(fixed,outside);}}
    append(fixed,poly);
   }
   if(!moving.length)continue;const fg=build(fixed,attrs,stride),mg=build(moving,attrs,stride);records.push({mesh,base,fg,mg});mesh.geometry=fg;
   const m=new T.Mesh(mg,mesh.material);m.name='DoorRecovered_'+id+'_'+mesh.name;m.position.copy(pivot.position).negate();m.castShadow=true;m.receiveShadow=true;pivot.add(m);added.push(m);
   const lower=[];for(let q=0;q<moving.length;q+=stride*3){let poly=[moving.slice(q,q+stride),moving.slice(q+stride,q+stride*2),moving.slice(q+stride*2,q+stride*3)];const [low]=clip(poly,v=>1.22-v[1]);for(const v of low)v[0]-=sign*.045;append(lower,low);}if(lower.length){const g=build(lower,attrs,stride),inner=new T.Mesh(g,lining);inner.name='RecoveredDoorLining_'+id;inner.position.copy(m.position);pivot.add(inner);added.push(inner);}
   audit.push({id,source:mesh.name,triangles:moving.length/stride/3});
  }
  // Move the hinge to the actual outer B-pillar edge without moving closed surfaces.
  const old=pivot.position.clone(),next=old.clone();next.x=sign*1.015;const delta=old.clone().sub(next);hinges.push({pivot,old,delta});for(const c of pivot.children)c.position.add(delta);pivot.position.copy(next);
  for(const y of [.72,1.08])for(const prefix of ['DoorHingeBracket_','DoorHingePin_']){const h=model.getObjectByName(prefix+id+'_'+y);if(h)h.position.x+=next.x-old.x;}
 }
 return {audit,dispose(){for(const o of added){if(o.name.startsWith('RecoveredDoorLining_'))o.geometry.dispose();o.removeFromParent();}lining.dispose();for(const {pivot,old,delta}of hinges){for(const c of pivot.children)c.position.sub(delta);pivot.position.copy(old);}for(const {mesh,base,fg,mg}of records.reverse()){mesh.geometry=base;fg.dispose();mg.dispose();}}};
}
