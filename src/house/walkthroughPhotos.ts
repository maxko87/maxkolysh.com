import type { PhotoReference } from './photoReferences';

/** Hand-selected stills from the owner's 8 September walkthrough, in filming order.
 * Camera positions are manually estimated in appraisal feet, not recovered poses. */
export const walkthroughPhotos: PhotoReference[] = [
  {id:'walk-nook',title:'Kitchen nook',roomId:'kitchen',time:1,view:{x:10,z:8,yaw:.7,pitch:-.2,fov:65},furniture:['Round pedestal table','Fluted L-shaped bench','Cream chairs']},
  {id:'walk-deck',title:'Out to the rear deck',roomId:'deck',time:12,view:{x:7,z:4,yaw:0,pitch:-.12,fov:65},furniture:['Dark railing','Fern planter']},
  {id:'walk-kitchen',title:'Kitchen range and cabinets',roomId:'kitchen',time:16.5,view:{x:12,z:9,yaw:-.4,pitch:-.12,fov:70},furniture:['White cabinets','Brass pulls','Stainless range']},
  {id:'walk-laundry',title:'Kitchen laundry cupboard',roomId:'kitchen',time:19,view:{x:15,z:15,yaw:-Math.PI/2,pitch:-.1,fov:65},furniture:['Stacked washer and dryer','White cupboard']},
  {id:'walk-hall',title:'Hall from the kitchen',roomId:'hallway',time:21,view:{x:13.4,z:21,yaw:Math.PI,pitch:-.1,fov:65},furniture:['Patterned hall runner']},
  {id:'walk-bedroom',title:'Primary bedroom',roomId:'rear-bed',time:23,view:{x:10,z:22,yaw:1.95,pitch:-.12,fov:70},furniture:['White bedding','Dark headboard','Blue-gray rug','Dark curtains']},
  {id:'walk-dressers',title:'Bedroom dressers and blue prints',roomId:'rear-bed',time:30.5,view:{x:4,z:28,yaw:-Math.PI/2,pitch:-.15,fov:70},furniture:['Two black dressers','Brass pulls','Two blue prints']},
  {id:'walk-spare',title:'Spare room · drying clothes',roomId:'side-bed',time:38,view:{x:16.5,z:22,yaw:-2.2,pitch:-.15,fov:70},furniture:['Drying rack','Pink patterned rug','Taupe curtains']},
  {id:'walk-shelves',title:'Spare room · shelving',roomId:'side-bed',time:41,view:{x:18,z:27,yaw:Math.PI,pitch:-.12,fov:70},furniture:['Tall walnut bookcase','Storage baskets']},
  {id:'walk-dining',title:'Dining bench and arched mirror',roomId:'dining',time:50.5,view:{x:20,z:40,yaw:0,pitch:-.12,fov:70},furniture:['Walnut table','Bench with pale throw','Cream chairs','Arched mirror']},
  {id:'walk-ceiling',title:'Living and dining · cedar ceiling',roomId:'living',time:54,view:{x:16,z:41,yaw:-2.8,pitch:.25,fov:75},furniture:['Pitched cedar ceiling','Brass chandelier']},
  {id:'walk-wood-bath',title:'Wood-paneled bathroom',roomId:'main-bath',time:62,view:{x:10,z:37,yaw:.9,pitch:-.15,fov:70},furniture:['Horizontal wood walls','Gray floating vanity','White toilet']},
  {id:'walk-living',title:'Living room · current seating',roomId:'living',time:72,view:{x:15,z:44,yaw:-2.75,pitch:-.1,fov:75},furniture:['White sofas','Walnut coffee table','Leather lounge chair']},
  {id:'walk-office',title:'Office · desk and navy cabinets',roomId:'front-bed',time:84.5,view:{x:10,z:49,yaw:2.3,pitch:-.12,fov:70},furniture:['Navy Murphy-bed cabinetry','Cream office chair']},
  {id:'walk-desk',title:'Office · desk beside the window',roomId:'front-bed',time:86,view:{x:5,z:52,yaw:-2.1,pitch:-.2,fov:70},furniture:['Walnut desk','Blank monitor','Taupe curtains']},
  {id:'walk-office-bath',title:'Office bathroom · wood vanity',roomId:'office-bath',time:94,view:{x:3,z:45,yaw:0,pitch:-.2,fov:70},furniture:['Wood vanity and cabinet','White vessel sink','Dark tile']},
  {id:'walk-shower',title:'Office bathroom · glass shower',roomId:'office-bath',time:96,view:{x:3,z:44.5,yaw:-1.2,pitch:0,fov:70},furniture:['Frameless glass shower','Chrome handle']},
  {id:'walk-entry',title:'Back at the front door',roomId:'living',time:105.5,view:{x:14,z:52,yaw:2.8,pitch:0,fov:65},furniture:['White entry door','Black hardware']},
].map(p => ({...p, date:'2026-09-08', confidence:'High', source:'walkthrough',
  evidence:`Connected walkthrough at ${Math.floor(p.time/60)}:${String(Math.floor(p.time%60)).padStart(2,'0')} establishes the room and visible furnishings. Camera alignment and object dimensions remain approximate.`}));
