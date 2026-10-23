// Lossless precomputed assembly recipe. Model bytes and material definitions stay original.
export async function loadAssemblyCache(expectedModelHash,expectedCacheHash){
 const response=await fetch('./assembly-cache.bin.gz');if(!response.ok)throw Error('装配缓存缺失');const compressed=await response.arrayBuffer();
 const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',compressed))].map(x=>x.toString(16).padStart(2,'0')).join('');if(hash!==expectedCacheHash)throw Error('装配缓存校验失败');
 const raw=await new Response(new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer(),view=new DataView(raw),length=view.getUint32(0,true);
 if(length>raw.byteLength-4)throw Error('装配缓存头损坏');const meta=JSON.parse(new TextDecoder().decode(new Uint8Array(raw,4,length))),start=4+length;
 if(meta.schema!==1||meta.modelGzipSha256!==expectedModelHash)throw Error('装配缓存与模型版本不匹配');
 const array=spec=>{if(spec.offset<0||spec.bytes<0||start+spec.offset+spec.bytes>raw.byteLength)throw Error('装配缓存越界');return raw.slice(start+spec.offset,start+spec.offset+spec.bytes);};
 const createGeometry=(T,sources,id)=>{const recipe=meta.geometries[id];if(!recipe)throw Error('装配几何缺失');const source=sources.get(recipe.source);if(!source)throw Error('装配源缺失 '+recipe.source);const data=new Uint8Array(array(recipe.indices)),map=new Int32Array(recipe.vertexCount);let offset=0,previous=0;
  for(let i=0;i<map.length;i++){let code=0,mult=1,byte;do{if(offset>=data.length||mult>2**35)throw Error('装配索引损坏');byte=data[offset++];code+=(byte&127)*mult;mult*=128;}while(byte&128);if(code%2)map[i]=-(Math.floor(code/2)+1);else{const zig=Math.floor(code/2),delta=zig%2?-(zig+1)/2:zig/2;previous+=delta;if(previous<0||previous>=(recipe.indexSpace==='draw'?(source.index?.count||source.attributes.position.count):source.attributes.position.count))throw Error('装配索引越界');map[i]=previous;}}
  if(offset!==data.length)throw Error('装配索引长度不一致');const special=new Float32Array(array(recipe.special)),stride=recipe.fields.reduce((n,f)=>n+f.size,0),g=new T.BufferGeometry();let fieldOffset=0;
  for(const f of recipe.fields){const a=source.attributes[f.name];if(!a||a.itemSize!==f.size)throw Error('装配属性不匹配 '+f.name);const values=new Float32Array(map.length*f.size);for(let i=0;i<map.length;i++){const ref=map[i],k=ref>=0&&recipe.indexSpace==='draw'&&source.index?source.index.getX(ref):ref;for(let j=0;j<f.size;j++)values[i*f.size+j]=k>=0?a.array[k*f.size+j]:special[(-k-1)*stride+fieldOffset+j];}g.setAttribute(f.name,new T.BufferAttribute(values,f.size));fieldOffset+=f.size;}g.computeBoundingSphere();return g;
 };
 return {meta,createGeometry};
}
