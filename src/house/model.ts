import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {addPersonalFurniture} from './personalFurniture';
const F=.3048;
export const rooms=[
{id:'living',name:'Living room',level:0,x:20,z:55},
{id:'dining',name:'Dining room',level:0,x:22,z:44},
{id:'kitchen',name:'Kitchen & nook',level:0,x:14,z:16},
{id:'front-bed',name:'Front office',level:0,x:8,z:51},
{id:'rear-bed',name:'Rear bedroom',level:0,x:9,z:29},
{id:'side-bed',name:'Side bedroom',level:0,x:16,z:31},
{id:'hallway',name:'Main hallway',level:0,x:12.2,z:31},
{id:'lower-living',name:'Living & dining',level:1,x:12,z:39},
{id:'lower-kitchen',name:'Kitchen',level:1,x:17,z:29},
{id:'lower-bed',name:'Front bedroom',level:1,x:16,z:55},
{id:'lower-bed-2',name:'Second bedroom',level:1,x:12,z:51},
{id:'basement',name:'Basement',level:1,x:12,z:16}];
type Rect={x:number,z:number,w:number,d:number};
export type HouseViewer=ReturnType<typeof createHouseViewer>;
export function createHouseViewer(container:HTMLDivElement){
 const scene=new T.Scene();scene.background=new T.Color('#e9e8e2');
 const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;container.appendChild(renderer.domElement);
 const camera=new T.PerspectiveCamera(45,1,.025,250),orbit=new OrbitControls(camera,renderer.domElement);orbit.enableDamping=true;orbit.minDistance=2;orbit.maxDistance=45;orbit.maxPolarAngle=Math.PI/2.02;
 scene.add(new T.HemisphereLight(0xfff8e9,0xb5bec0,2.8));const sun=new T.DirectionalLight(0xffedcf,3.2);sun.position.set(-10,22,12);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-20,right:20,top:24,bottom:-24,near:.1,far:70});sun.shadow.normalBias=.025;scene.add(sun);const fill=new T.DirectionalLight(0xe6efff,1.1);fill.position.set(15,9,-8);scene.add(fill);
 const model=new T.Group();model.name='716 Douglass — approximate appraisal reconstruction';scene.add(model);
 const groups=[new T.Group(),new T.Group()],ceilings=[new T.Group(),new T.Group()],walls:T.Mesh[][]=[[],[]],blockers:Rect[][]=[[],[]];groups.forEach((g,i)=>{g.name=i?'Lower level':'Main level';g.add(ceilings[i]);model.add(g);});
 const mat=(color:string)=>new T.MeshStandardMaterial({color,roughness:.8});
 const plaster=mat('#f1eee5'),trim=mat('#fffaf1'),wood=mat('#a46e43'),walnut=mat('#5a3e2c'),cream=mat('#e4ddcd'),dark=mat('#292e2d'),sage=mat('#91a092'),stone=mat('#dbd5c7');
 const glass=new T.MeshStandardMaterial({color:'#b0cbd1',transparent:true,opacity:.38,roughness:.18,metalness:.15});
 let active=0,walking=false,yaw=0,pitch=0,dragging=false,lastX=0,lastY=0;const pressed=new Set<string>();
 function box(g:T.Object3D,name:string,x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material){const o=new T.Mesh(new T.BoxGeometry(w*F,h*F,d*F),m);o.position.set(x*F,y*F,z*F);o.name=name;o.castShadow=true;o.receiveShadow=true;g.add(o);return o;}
 function cyl(g:T.Object3D,x:number,y:number,z:number,r:number,h:number,m:T.Material){const o=new T.Mesh(new T.CylinderGeometry(r*F,r*F,h*F,16),m);o.position.set(x*F,y*F,z*F);o.castShadow=true;g.add(o);return o;}
 const outlines:number[][][]=[[[11,0],[21,0],[21,20],[25,20],[25,58],[24,58],[24,61],[16,61],[16,58],[14,58],[14,56],[11,56],[11,58],[0,58],[0,40],[4,40],[4,32],[0,32],[0,18.5],[4,18.5],[4,5.5],[11,5.5]],[[4,20],[25,20],[25,58],[24,58],[24,61],[16,61],[16,58],[4,58]]];
 function inside(x:number,z:number,pts:number[][]){let ok=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const a=pts[i],b=pts[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])ok=!ok;}return ok;}
 function slab(g:T.Object3D,pts:number[][],m:T.Material){const s=new T.Shape();pts.forEach(([x,z],i)=>i?s.lineTo(x,-z):s.moveTo(x,-z));s.closePath();const o=new T.Mesh(new T.ExtrudeGeometry(s,{depth:.45,bevelEnabled:false}),m);o.rotation.x=-Math.PI/2;o.scale.setScalar(F);o.position.y=-.45*F;o.receiveShadow=true;g.add(o);}
 function wall(level:number,x:number,z:number,w:number,d:number,door?:number){const h=level?8.3:9.5,g=groups[level];if(door!==undefined){const hor=w>d,len=hor?w:d,start=(hor?x:z)-len/2,gap=3,a=door-gap/2-start,b=start+len-door-gap/2;if(a>.05)wall(level,hor?start+a/2:x,hor?z:start+a/2,hor?a:w,hor?d:a);if(b>.05)wall(level,hor?door+gap/2+b/2:x,hor?z:door+gap/2+b/2,hor?b:w,hor?d:b);box(ceilings[level],'Door header — inferred',hor?door:x,7.3+(h-7.3)/2,hor?z:door,hor?gap:w,h-7.3,hor?d:gap,plaster);return;}
 const o=box(g,'Wall — provisional openings',x,h/2,z,w,h,d,plaster);o.userData.fullHeight=h;walls[level].push(o);blockers[level].push({x,z,w,d});box(g,'Baseboard',x,.25,z,w+.04,.5,d+.04,trim);}
 function win(i:number,x:number,z:number,w:number,side=false){box(groups[i],'Window — inferred',x,5.5,z,side?.14:w,4.5,side?w:.14,glass);[3.2,5.5,7.8].forEach(y=>box(groups[i],'Window rail',x,y,z,side?.25:w+.2,.15,side?w+.2:.25,trim));[-1,1].forEach(a=>box(groups[i],'Window frame',x+(side?0:a*w/2),5.5,z+(side?a*w/2:0),side?.25:.15,4.7,side?.15:.25,trim));}
 function bed(g:T.Object3D,x:number,z:number){box(g,'Bed frame',x,.6,z,5.1,1.1,6.7,walnut);box(g,'Linen duvet',x,1.25,z,5,.55,6.5,cream);box(g,'Headboard',x,2,z-3.3,5.3,3.4,.32,sage);[-1.3,1.3].forEach(a=>box(g,'Pillow',x+a,1.67,z-2,2,.28,1.25,trim));box(g,'Bed throw',x,1.57,z+1.8,5.05,.14,1.7,sage);[-3.2,3.2].forEach(a=>{box(g,'Nightstand',x+a,.9,z-2.5,1.2,1.8,1.2,wood);cyl(g,x+a,2.1,z-2.5,.32,.6,cream);});}
 function plant(g:T.Object3D,x:number,z:number){cyl(g,x,.7,z,.65,1.4,stone);cyl(g,x,2.1,z,.08,2.3,walnut);for(let j=0;j<7;j++){const o=new T.Mesh(new T.SphereGeometry(F*.78,10,8),sage);o.scale.set(.8,1.15,.55);o.position.set((x+Math.sin(j*2)*.55)*F,(2+j*.28)*F,(z+Math.cos(j*2)*.55)*F);o.rotation.z=j;o.castShadow=true;g.add(o);}}
 function sofa(g:T.Object3D,x:number,z:number){box(g,'Sofa base',x,.7,z,2.8,1.15,7.6,cream);box(g,'Sofa back',x-1.15,1.7,z,.45,2,7.6,cream);[-3.6,3.6].forEach(a=>box(g,'Sofa arm',x,1.35,z+a,2.8,1.2,.35,cream));[-2.3,0,2.3].forEach(a=>{box(g,'Seat cushion',x+.2,1.4,z+a,2.3,.32,2.2,trim);box(g,'Cushion',x-.68,2,z+a,.35,1.15,1.45,a?stone:dark);});}
 function rug(g:T.Object3D,x:number,z:number,w:number,d:number){box(g,'Woven rug',x,.045,z,w,.06,d,cream);for(let a=-w/2+.3;a<w/2;a+=.42)box(g,'Rug stripe',x+a,.079,z,.06,.005,d-.25,stone);}
 function dining(g:T.Object3D,x:number,z:number){box(g,'Dining table',x,2.55,z,3.1,.22,5.8,stone);[-1,1].forEach(a=>[-1,1].forEach(b=>box(g,'Table leg',x+a,1.2,z+b*2.2,.15,2.5,.15,dark)));[-1,1].forEach(a=>[-1.8,0,1.8].forEach(b=>{box(g,'Dining chair',x+a*2.3,1.5,z+b,1.35,.2,1.35,sage);box(g,'Chair back',x+a*2.85,2.1,z+b,.18,1.5,1.35,sage);box(g,'Chair base',x+a*2.3,.75,z+b,.8,1.4,.8,dark);}));cyl(g,x,2.9,z,.35,.5,sage);}
 function kitchen(g:T.Object3D,x:number,z:number,w:number,d:number){box(g,'Back cabinets',x,1.5,z,w,3,2.05,cream);box(g,'Stone countertop',x,3.09,z,w+.1,.18,2.2,trim);box(g,'Side cabinets',x+w/2-1,1.5,z+d/2,2,3,d,cream);box(g,'Stone countertop',x+w/2-1,3.09,z+d/2,2.2,.18,d,trim);for(let a=-w/2+.8;a<w/2;a+=1.8){box(g,'Cabinet door',x+a,1.55,z+1.04,1.68,2.6,.07,trim);box(g,'Brass pull',x+a,2.2,z+1.12,.4,.05,.05,walnut);}box(g,'Sink basin',x-.5,3.2,z,2,.07,1.4,dark);box(g,'Faucet',x-.5,3.6,z-.65,.12,.9,.12,stone);box(g,'Range',x+w/2-1,1.7,z+4,2.05,3.1,2.5,dark);box(g,'Refrigerator',x+w/2-1,3.35,z+d+2,2.6,6.7,2.8,stone);box(g,'Fridge handle',x+w/2-2.4,3.8,z+d+1.1,.08,1.4,.08,dark);}
 function bath(g:T.Object3D,x:number,z:number,w:number,d:number){box(g,'Bathroom tile',x,.04,z,w,.08,d,stone);box(g,'Vanity',x+w/2-1,1.4,z-d/2+1.3,1.6,2.8,2.2,sage);box(g,'Basin',x+w/2-1,2.9,z-d/2+1.3,1.8,.17,2.4,trim);box(g,'Shower tray',x,.16,z+d/2-1.6,w-.3,.3,3,trim);box(g,'Shower glass',x,3.4,z+d/2-3,w-.3,6.5,.08,glass);cyl(g,x-w/2+1.2,.7,z-d/2+1.5,.65,1.4,trim);}
 groups.forEach((g,i)=>{slab(g,outlines[i],wood);for(let x=.25;x<25;x+=.48)for(let z=.6;z<61;z+=5)if(inside(x,z,outlines[i])&&inside(x,z+4.8,outlines[i]))box(g,'Floor seam',x,.008,z+2.4,.014,.006,4.8,walnut);outlines[i].forEach((p,k)=>{const q=outlines[i][(k+1)%outlines[i].length];wall(i,(p[0]+q[0])/2,(p[1]+q[1])/2,Math.max(.35,Math.abs(p[0]-q[0])),Math.max(.35,Math.abs(p[1]-q[1])));});});
 wall(0,10.7,47,.3,22,52);wall(0,10.7,28,.3,16,27);wall(0,13.8,27.5,.3,15,28);wall(0,5.35,48,10.7,.3,8.5);wall(0,7.3,40,6.6,.3,8.5);wall(0,7.3,32,6.6,.3,8.5);wall(0,19.4,35,11.2,.3,15.6);wall(0,14.5,20,21,.3,12.1);
 const staging=new T.Group();staging.name='Appraisal-style staging';groups[0].add(staging);
 bed(staging,5,53.5);bed(groups[0],5.2,25);bed(groups[0],19.8,26.2);bath(groups[0],5.4,44,10.2,7.5);bath(groups[0],7.3,36,6.2,7.4);
 rug(staging,19.1,53.3,7.4,9);sofa(staging,15.3,53);box(staging,'Coffee table',19.2,1.35,52,2.7,.3,3.3,stone);box(staging,'Table plinth',19.2,.7,52,1.5,1.3,2,stone);plant(staging,23,58.5);plant(staging,23,38);dining(staging,19.5,40.6);kitchen(groups[0],16,1.3,9.2,9);dining(staging,7.4,12.5);
 const personal=addPersonalFurniture(groups[0]);staging.visible=false;
 win(0,19.7,60.7,5.6);win(0,16,.3,5.2);win(0,20.7,7,5,true);
 for(let x=14;x<25;x+=.52){const o=box(ceilings[0],'Sloped wood ceiling — inferred',x,10.2+(25-x)*.26,46.5,.51,.16,23,wood);o.rotation.z=-.255;}
 [41,53].forEach(z=>{const light=new T.PointLight(0xffd89b,30,6,2);light.position.set(19*F,8*F,z*F);groups[0].add(light);cyl(ceilings[0],19,8.8,z,.7,.55,cream);});
 slab(groups[1],[[4,6],[21,6],[21,20],[4,20]],stone);wall(1,4,13,.35,14);wall(1,21,13,.35,14);wall(1,12.5,6,17,.35);wall(1,14,49,.3,18,44);wall(1,9,44,10,.3,11.8);wall(1,19.5,48,11,.3,16);wall(1,16,40,.3,16,35);wall(1,20.5,40,9,.3,18);wall(1,20.5,32,9,.3,18);
 bed(groups[1],8,51);bed(groups[1],20,55);bath(groups[1],20.5,44,8.5,7.5);rug(groups[1],9.5,37,8,8);sofa(groups[1],6,37);box(groups[1],'Coffee table',10,1.3,37,2.5,.25,3.8,stone);dining(groups[1],9.7,26.3);kitchen(groups[1],20,21.5,8,6);box(groups[1],'Washer',19,1.55,35,2.4,3.1,2.5,trim);box(groups[1],'Dryer',22,1.55,35,2.4,3.1,2.5,trim);win(1,20,60.7,5.5);plant(groups[1],5.5,22);for(let j=0;j<3;j++)box(groups[1],'Basement shelving',19,1.4+j*1.9,12,2,.14,8,walnut);
 box(scene,'Display ground',12,-.9,30,130,.3,140,mat('#e6e5de'));
 function viewWalls(full:boolean){walls[active].forEach(o=>{const h=o.userData.fullHeight;o.scale.y=full?1:.28;o.position.y=(full?h/2:h*.14)*F;});ceilings[active].visible=full;}
 function overview(){walking=false;pressed.clear();orbit.enabled=true;viewWalls(false);camera.fov=42;camera.updateProjectionMatrix();camera.position.set(38*F,65*F,91*F);orbit.target.set(9*F,0,30*F);orbit.update();}
 function setLevel(i:number){active=i;groups.forEach((g,j)=>g.visible=i===j);overview();}
 function look(){camera.rotation.order='YXZ';camera.rotation.set(pitch,yaw,0);}
 function visit(id:string){const r=rooms.find(v=>v.id===id);if(!r)return;active=r.level;groups.forEach((g,j)=>g.visible=j===active);walking=true;orbit.enabled=false;viewWalls(true);yaw=0;pitch=0;camera.fov=72;camera.updateProjectionMatrix();camera.position.set(r.x*F,5.35*F,r.z*F);look();}
 function setFurniture(kind:'personal'|'staging'){personal.visible=kind==='personal';staging.visible=kind==='staging';}
 function matchPhoto(roomId:string,view:{x:number;z:number;yaw:number;pitch:number;fov:number}){visit(roomId);camera.position.set(view.x*F,5.35*F,view.z*F);yaw=view.yaw;pitch=view.pitch;camera.fov=view.fov;camera.updateProjectionMatrix();look();}
 function move(dir:string,on:boolean){if(on)pressed.add(dir);else pressed.delete(dir);}
 const keys:Record<string,string>={KeyW:'forward',ArrowUp:'forward',KeyS:'back',ArrowDown:'back',KeyA:'strafe-left',KeyD:'strafe-right',ArrowLeft:'left',ArrowRight:'right'};
 const keydown=(e:KeyboardEvent)=>{if(e.target instanceof HTMLElement&&e.target.closest('input,textarea,select,[contenteditable="true"],[role="dialog"]'))return;if(walking&&keys[e.code]){e.preventDefault();move(keys[e.code],true);}},keyup=(e:KeyboardEvent)=>move(keys[e.code],false),clear=()=>{pressed.clear();dragging=false;};
 const down=(e:PointerEvent)=>{if(!walking)return;dragging=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId);},pointer=(e:PointerEvent)=>{if(!dragging||!walking)return;yaw-=(e.clientX-lastX)*.004;pitch=T.MathUtils.clamp(pitch-(e.clientY-lastY)*.003,-1.1,1.1);lastX=e.clientX;lastY=e.clientY;look();},up=()=>dragging=false;
 renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointermove',pointer);renderer.domElement.addEventListener('pointerup',up);window.addEventListener('keydown',keydown);window.addEventListener('keyup',keyup);window.addEventListener('blur',clear);
 const resize=new ResizeObserver(()=>{const w=container.clientWidth,h=container.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();});resize.observe(container);setLevel(0);let previous=performance.now();
 function allowed(x:number,z:number){return (inside(x,z,outlines[active])||(active===1&&x>4.5&&x<20.5&&z>6.5&&z<20))&&!blockers[active].some(b=>Math.abs(x-b.x)<b.w/2+.28&&Math.abs(z-b.z)<b.d/2+.28);}
 renderer.setAnimationLoop(()=>{const now=performance.now(),dt=Math.min((now-previous)/1000,.04);previous=now;if(walking){if(pressed.has('left'))yaw+=dt*1.1;if(pressed.has('right'))yaw-=dt*1.1;const f=(pressed.has('forward')?1:0)-(pressed.has('back')?1:0),s=(pressed.has('strafe-right')?1:0)-(pressed.has('strafe-left')?1:0),x=camera.position.x/F,z=camera.position.z/F,speed=dt*7,nx=x+(-Math.sin(yaw)*f+Math.cos(yaw)*s)*speed,nz=z+(-Math.cos(yaw)*f-Math.sin(yaw)*s)*speed;if(allowed(nx,z))camera.position.x=nx*F;if(allowed(camera.position.x/F,nz))camera.position.z=nz*F;look();}else orbit.update();renderer.render(scene,camera);});
 async function download(){const saved=groups.map(g=>g.visible);groups.forEach((g,i)=>{g.visible=true;g.position.y=i?-10.5*F:0;walls[i].forEach(o=>{o.scale.y=1;o.position.y=o.userData.fullHeight/2*F;});ceilings[i].visible=true;});try{const glb=await new GLTFExporter().parseAsync(model,{binary:true});const url=URL.createObjectURL(new Blob([glb as ArrayBuffer],{type:'model/gltf-binary'}));const a=document.createElement('a');a.href=url;a.download='716-douglass-first-model.glb';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}finally{groups.forEach((g,i)=>{g.position.y=0;g.visible=saved[i];});viewWalls(walking);}}
 return {setLevel,overview,visit,move,download,setFurniture,matchPhoto,dispose(){renderer.setAnimationLoop(null);resize.disconnect();orbit.dispose();window.removeEventListener('keydown',keydown);window.removeEventListener('keyup',keyup);window.removeEventListener('blur',clear);scene.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.Line){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());}});renderer.dispose();renderer.domElement.remove();}};
}
