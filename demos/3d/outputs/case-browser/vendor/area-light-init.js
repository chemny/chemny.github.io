import {RectAreaLightTexturesLib} from './RectAreaLightTexturesLib.js';
const initialized=new WeakSet();
export function initAreaLights(T){if(initialized.has(T.UniformsLib))return;RectAreaLightTexturesLib.init();for(const key of ['LTC_FLOAT_1','LTC_FLOAT_2','LTC_HALF_1','LTC_HALF_2'])T.UniformsLib[key]=RectAreaLightTexturesLib[key];initialized.add(T.UniformsLib);}
