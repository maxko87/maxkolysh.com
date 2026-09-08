/** Interior topology traced from the owner's saved 716/716A listing plan.
 * Exterior scale remains the appraisal's feet. Interior positions are approximate.
 * z=0 is the rear kitchen; z=61 is the front bay. */
export const rooms = [
  {id:'living',name:'Living room',level:0,x:18,z:54},
  {id:'dining',name:'Dining room',level:0,x:17,z:40},
  {id:'kitchen',name:'Kitchen & nook',level:0,x:13,z:11},
  {id:'front-bed',name:'Front office',level:0,x:7.5,z:51},
  {id:'rear-bed',name:'Primary bedroom',level:0,x:9,z:26.4,yaw:Math.PI/2},
  {id:'side-bed',name:'Spare / drying room',level:0,x:17,z:25},
  {id:'hallway',name:'Main hallway',level:0,x:13.3,z:30},
  {id:'main-bath',name:'Wood-paneled bath',level:0,x:10,z:37.1,yaw:2.05,pitch:-.08},
  {id:'office-bath',name:'Office bathroom',level:0,x:3,z:44.4},
  {id:'deck',name:'Rear deck & garden',level:0,x:7.2,z:1.5},
  {id:'lower-living',name:'Living & dining',level:1,x:11,z:33},
  {id:'lower-kitchen',name:'Kitchen',level:1,x:18,z:27},
  {id:'lower-bed',name:'Front right bedroom',level:1,x:20,z:54},
  {id:'lower-bed-2',name:'Front left bedroom',level:1,x:8,z:52},
  {id:'lower-bath',name:'Bathroom & laundry',level:1,x:20,z:39},
  {id:'basement',name:'Rear storage',level:1,x:12,z:13},
];
// x, z, width, depth, optional door center along the long axis, optional door width.
export type WallSpec = [number,number,number,number,number?,number?];
export const partitions: WallSpec[][] = [
  [
    [11.5,27.2,.32,14.4,21.9], [15.4,27.5,.32,15,22.1],
    [7.75,33.5,7.5,.32], [20.2,34.8,9.6,.32],
    [11.5,45.9,.32,12.2,48.5,4.2],
    // The wood bathroom's shower extends toward the office, beside its bathroom.
    [10.35,39.8,2.3,.32], [4,41.45,.32,3.3],
    [9.2,41.45,.32,3.3], [7.75,43.1,7.5,.32],
    [5.75,46.1,11.5,.32,2.5,2.4],
    [8,44.6,.32,3],
    [11.5,36.65,.32,6.3,37.1,2.6],
    [10,55,.32,6], [10.75,52,1.5,.32],
    [6.6,14.6,5.2,.32], [9.2,17.3,.32,5.4],
    [8.15,20,8.3,.32,6.5,2.8],
    [10.3,17.6,2.2,.32], [11.4,18.8,.32,2.4],
    [18.2,17.7,5.6,.32], [18.2,20,5.6,.32,18.2,2.8],
  ],
  [
    [14.2,52.25,.32,11.5], [9.1,46.5,10.2,.32,12.3,2.8],
    [19.6,46.5,10.8,.32,16,2.8],
    [7,49,6,.32,7,2.8], [10,47.75,.32,2.5],
    [21.5,49,7,.32,21,2.8], [18,47.75,.32,2.5],
    [17.5,40.95,.32,11.1,42.8,2.6], [21.25,35.4,7.5,.32],
    [12.2,39.3,.32,2.4], [11,38.1,2.4,.32],
  ],
];
