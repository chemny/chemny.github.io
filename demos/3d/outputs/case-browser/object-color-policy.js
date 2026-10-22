// Explicit semantic allowlists: an unknown part remains protected by default.
export function objectColorPolicy(caseId){
 if(caseId==='cloth-doll')return {
  choices:[['clothing','衣服']],
  group(id){
   if(['romper','neckline-binding','romper-center-seam'].includes(id)||id.startsWith('collar-stitch-'))return 'clothing';
   return null;
  },
  tintFactor(id){
   if(id==='neckline-binding'||id==='romper-center-seam')return .78;
   if(id.startsWith('collar-stitch-'))return .88;
   return 1;
  }
 };
 if(caseId==='yellow-chick')return {
  choices:[['all','主体整体']],
  group:id=>['body','head','crest-center','crest-left','crest-right','wing-left','wing-right','tail','tail-tip'].includes(id)?'body':null,
  tintFactor:()=>1
 };
 return null;
}
