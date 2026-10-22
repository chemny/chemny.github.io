import * as T from 'three';
import {createPresentation} from '/demos/3d/outputs/case-browser/presentation.js';
export const backgrounds=[['light','自然棚拍','#e8e8e5'],['architecture','浅色建筑','#e7e4dd'],['dark','深色展厅','#171a1d']];
export function createPresentationScene({scene,renderer,ambient,sun,fill}){
 for(const light of [ambient,sun,fill])light.visible=false;
 const presentation=createPresentation(T,renderer,scene);
 return {...presentation,beforeRender(){},getState:()=>({...scene.userData.presentation})};
}
