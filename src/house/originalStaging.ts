import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
const F=.3048;

/** Reconstruct visible listing furnishings, not the previous generic appraisal staging. */
export function addOriginalStaging(main:T.Group,lower:T.Group) {
  const layers=[new T.Group(),new T.Group()];
  layers.forEach((g,i)=>{g.name=`Listing-video staging — ${i?'lower':'main'} level`;g.userData={basis:'Owner-supplied 1:27 listing tour',dimensions:'estimated'};(i?lower:main).add(g);});
  const mat=(color:string)=>new T.MeshStandardMaterial({color,roughness:.8});
  const white=mat('#eeeae1'),dark=mat('#343936'),walnut=mat('#5a3c29'),pale=mat('#e2d9c5'),blue=mat('#647c85'),gold=mat('#b49955');
  function group(level:number,name:string,x:number,z:number,rotation=0){const g=new T.Group();g.name=name;g.position.set(x*F,0,z*F);g.rotation.y=rotation;layers[level].add(g);return g;}
  function box(g:T.Object3D,name:string,x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material,round=0){
    const mesh=new T.Mesh(round?new RoundedBoxGeometry(w*F,h*F,d*F,3,Math.min(round,w/3,h/3,d/3)*F):new T.BoxGeometry(w*F,h*F,d*F),m);
    mesh.name=name;mesh.position.set(x*F,y*F,z*F);mesh.castShadow=mesh.receiveShadow=true;g.add(mesh);return mesh;
  }
  function cyl(g:T.Object3D,name:string,x:number,y:number,z:number,r:number,h:number,m:T.Material){const mesh=new T.Mesh(new T.CylinderGeometry(r*F,r*F,h*F,24),m);mesh.name=name;mesh.position.set(x*F,y*F,z*F);mesh.castShadow=true;g.add(mesh);return mesh;}
  function rug(level:number,x:number,z:number,w:number,d:number,checked=false){
    const g=group(level,checked?'Listing gray checked rug':'Listing area rug',x,z);
    box(g,'Rug base',0,.04,0,w,.06,d,checked?dark:level?blue:pale);
    if(checked)for(let a=-w/2+.3;a<w/2-.2;a+=.85)for(let b=-d/2+.3;b<d/2-.2;b+=1.1)box(g,'Cream rug check',a,.079,b,.58,.006,.83,white);
    return g;
  }
  function sofa(level:number,x:number,z:number,width:number,rotation:number){
    const g=group(level,'Listing white sofa',x,z,rotation);
    box(g,'Low sofa body',0,.85,0,width,1.4,3,white,.18);
    box(g,'Soft sofa back',0,1.95,-1.2,width,1.8,.5,white,.18);
    for(const s of [-1,1]){
      box(g,'Rounded sofa arm',s*(width/2-.2),1.55,.05,.42,1.35,3,white,.18);
      box(g,'Charcoal scatter cushion',s*(width/2-1.1),2.15,-.72,1.25,1.2,.4,dark,.15).rotation.z=s*.12;
    }
    for(let i=0;i<3;i++)box(g,'Seat cushion',-width/3+i*width/3,1.5,.2,width/3-.15,.4,2.5,white,.15);
  }
  function chair(level:number,x:number,z:number,rotation:number){
    const g=group(level,'Listing cream wood-frame accent chair',x,z,rotation);
    box(g,'Curved chair body',0,1.1,0,2.25,1.4,2.5,white,.2);
    box(g,'Cream chair back',0,2,-1,2.3,1.8,.4,white,.2);
    box(g,'Dark accent pillow',0,2.1,-.72,1.3,1.1,.3,dark,.1);
    for(const s of [-1,1]){box(g,'Bentwood arm',s*1.15,1.85,0,.13,.18,2.2,walnut,.05);box(g,'Chair leg',s*.9,.45,0,.12,.9,1.8,walnut);}
  }
  function bed(level:number,x:number,z:number,rotation=0){
    const g=group(level,'Listing upholstered bed',x,z,rotation);
    box(g,'Cream bed frame',0,.65,0,5.5,1.1,6.8,white,.12);
    box(g,'Pale duvet',0,1.3,0,5.55,.6,6.6,white,.2);
    box(g,'Tall channel-tufted headboard',0,2.5,-3.35,5.8,4.5,.35,pale,.1);
    for(let a=-2.6;a<2.8;a+=.52)box(g,'Upholstery channel',a,2.5,-3.13,.045,4.2,.02,white);
    box(g,'Taupe bed throw',0,1.63,1.5,5.6,.12,2.9,mat('#aa9b84'));
    for(const s of [-1,1]){box(g,'Pale pillow',s*1.3,1.85,-2,2.3,.4,1.35,white,.12);box(g,'Dark decorative cushion',s*.7,2,-1.5,1.2,.6,.45,dark,.1);box(g,'Small nightstand',s*3.45,1.1,-2.65,1.1,2.2,1.25,walnut);cyl(g,'Bedside lamp',s*3.45,2.75,-2.65,.3,.7,white);}
  }
  function dining(level:number,x:number,z:number,r:number){
    const g=group(level,'Listing round dark dining table',x,z);
    cyl(g,'Round tabletop',0,2.5,0,r,.18,dark);cyl(g,'Pedestal',0,1.25,0,.5,2.5,dark);
    for(let i=0;i<4;i++){
      const a=i*Math.PI/2,seat=new T.Group();seat.position.set(Math.sin(a)*(r+1)*F,0,Math.cos(a)*(r+1)*F);seat.rotation.y=a+Math.PI;g.add(seat);
      box(seat,'Cream dining seat',0,1.55,0,1.65,.25,1.65,pale,.1);box(seat,'Dark curved chair back',0,2.3,-.7,1.7,.8,.15,dark,.06);
      for(const s of [-1,1])box(seat,'Dining chair legs',s*.6,.75,0,.09,1.5,1.2,dark);
    }
    cyl(g,'Table vase',0,2.95,0,.25,.7,white);
  }
  rug(0,19.7,51.5,8.3,10.5,true);sofa(0,23.15,51.5,8.3,-Math.PI/2);
  chair(0,16.1,54.5,Math.PI/2);
  const stool=group(0,'Listing upholstered stool',18,47.6);
  box(stool,'Pale padded stool seat',0,1.5,0,2.2,.3,1.6,white,.12);
  for(const x of [-.9,.9])box(stool,'Thin dark stool legs',x,.7,0,.05,1.4,1.3,dark);
  const coffee=group(0,'Listing two sculptural white coffee tables',19.5,51.5);
  for(const [x,z,angle] of [[-.45,-.65,.15],[.6,.8,-.35]]){
    const top=box(coffee,'Sculptural pale tabletop',x,1.3,z,2.5,.24,2,white,.4);top.rotation.y=angle;
    box(coffee,'Block table pedestal',x,.65,z,.75,1.3,1.2,pale,.08);
  }
  const console=group(0,'Listing walnut bay console and twin lamps',20,59.65);
  box(console,'Walnut console cabinet',0,1.75,0,5.7,2.5,1.5,walnut,.035);
  for(const x of [-2.45,2.45]){box(console,'Console leg',x,.4,0,.1,.8,1.2,dark);cyl(console,'Pale table lamp base',x*.75,3.5,0,.18,1,white);cyl(console,'Black lampshade',x*.75,4.1,0,.35,.65,dark);}
  const art=group(0,'Listing paired blue-gray sofa artwork',24.75,51.5,-Math.PI/2);
  for(const x of [-1.9,1.9]){box(art,'Thin picture frame',x,5.8,0,3.6,2.8,.07,dark);box(art,'Blue-gray abstract print',x,5.8,.045,3.45,2.65,.02,blue);for(let y=4.6;y<7;y+=.3)box(art,'Light artwork line',x,y,.06,3.4,.02,.005,pale);}
  dining(0,20,39.7,2.25);
  rug(0,5.8,52.5,7,9);
  const office=group(0,'Listing oval walnut office desk',6,53.4);
  const top=cyl(office,'Oval desk top',0,2.5,0,1,.18,walnut);top.scale.set(3,1,1.3);
  for(const x of [-1.85,1.85]){const leg=cyl(office,'Curved desk pedestal',x,1.25,0,.6,2.5,walnut);leg.scale.z=1.5;}
  const deskChair=group(0,'Listing bentwood office chair',6,55.6,Math.PI);
  box(deskChair,'Tan chair seat',0,1.6,0,1.65,.2,1.5,pale,.1);box(deskChair,'Walnut chair back',0,2.3,-.65,1.6,.8,.15,walnut,.1);
  for(const x of [-.65,.65])box(deskChair,'Wood chair leg',x,.8,0,.1,1.6,1.3,walnut);
  rug(0,5.7,26.4,9,10);bed(0,4.7,26.4,Math.PI/2);
  const primaryArt=group(0,'Listing paired small bedroom prints',.6,26.4,Math.PI/2);
  for(const x of [-2.1,2.1]){box(primaryArt,'White matted picture',x,6.5,0,1.45,1.65,.1,white);box(primaryArt,'Small dark print',x,6.5,.06,.65,.75,.03,dark);}
  const spare=group(0,'Spare bedroom — not shown in listing video; provisional',20,27);
  box(spare,'Provisional pale bed',0,.9,0,5,1.6,6.7,pale,.12);
  dining(0,7.4,11,1.7);
  const patio=group(0,'Listing garden lounge set',12,-11);
  for(const [x,z,rotation,width] of [[6,0,-Math.PI/2,5.5],[-4,-2,Math.PI/2,2.5],[-1,-5,0,2.5]]){
    const seat=new T.Group();seat.position.set(x*F,0,z*F);seat.rotation.y=rotation;patio.add(seat);
    box(seat,'Dark outdoor chair frame',0,.8,0,width,1.4,2.7,dark,.08);
    box(seat,'Gray outdoor seat',0,1.5,.15,width-.25,.35,2.5,blue,.12);
    box(seat,'Gray outdoor back',0,2.1,-1.1,width-.25,1.5,.35,blue,.12);
    box(seat,'Pale outdoor cushion',0,2.1,-.8,1.3,1.1,.3,white,.12);
  }
  cyl(patio,'Pale round outdoor table',0,.7,0,1.4,1.3,pale);
  for(const [x,z] of [[-5,3],[4,-5],[6,5]])cyl(patio,'Yellow garden planter',x,1,z,.8,2,mat('#bbaa22'));
  // No inferred contemporary furniture downstairs: these are listing-era objects only.
  rug(1,9.5,34,8,9);sofa(1,6.1,33.8,7.1,Math.PI/2);
  const lowerTable=group(1,'Listing lower round coffee table',10.2,34);
  cyl(lowerTable,'Low dark round table',0,1.35,0,1.65,.17,walnut);cyl(lowerTable,'Coffee table base',0,.65,0,.85,1.3,dark);
  dining(1,10,25,2);
  const lowerArt=group(1,'Listing lower teal sofa artwork',4.3,33.8,Math.PI/2);
  box(lowerArt,'Long teal wall artwork',0,5.4,0,6,2.2,.1,mat('#34636a'));
  rug(1,8.6,53,7.7,8.4);bed(1,8.6,53);
  rug(1,20,55,7.5,8);bed(1,20,55,Math.PI);
  const kitchen=group(1,'Listing lower honey-wood kitchen',0,0);
  const honey=mat('#af743b'),counter=mat('#a9aca0'),steel=mat('#a8aeae');
  for(const [x,z,w,d] of [[20,21.5,8,2],[23,26.5,2,9]]){
    box(kitchen,'Honey-wood lower cabinets',x,1.5,z,w,3,d,honey);box(kitchen,'Gray-green countertop',x,3.1,z,w+.1,.2,d+.1,counter);
  }
  box(kitchen,'Stainless range',23,1.6,25.5,2.05,3.2,2.6,steel);box(kitchen,'Range dark oven face',21.94,1.7,25.5,.04,1.8,2,dark);
  box(kitchen,'Stainless refrigerator',23,3.4,32.2,2.6,6.8,2.7,steel);
  for(let x=16.8;x<24;x+=1.7){box(kitchen,'Honey-wood upper cupboard',x,6.2,21.3,1.55,2.6,1.2,honey);box(kitchen,'Brass cabinet handle',x,6.1,21.95,.05,.7,.06,gold);}
  return layers;
}
