/** Main-level window locations cross-checked against the listing plan and walkthrough.
 * All dimensions are approximate feet. axis is the direction along the wall. */
export type WindowSpec = {
  id:string; roomId:string; axis:'x'|'z'; fixed:number; center:number; width:number;
  sill:number; height:number; finish?:'wood'; frosted?:boolean;
};
export const mainWindows:WindowSpec[] = [
  {id:'primary-rear',roomId:'rear-bed',axis:'x',fixed:18.5,center:2,width:2.6,sill:1.1,height:7.2},
  {id:'primary-front',roomId:'rear-bed',axis:'x',fixed:32,center:2,width:2.6,sill:1.1,height:7.2},
  {id:'spare-side',roomId:'side-bed',axis:'z',fixed:25,center:22.5,width:3.2,sill:1.1,height:7.2},
  {id:'kitchen-sink',roomId:'kitchen',axis:'x',fixed:0,center:16,width:4.6,sill:3.4,height:4.4},
  {id:'kitchen-side',roomId:'kitchen',axis:'z',fixed:21,center:7.8,width:3.6,sill:3.4,height:4.4},
  {id:'office-front',roomId:'front-bed',axis:'x',fixed:58,center:5.7,width:3.5,sill:1.1,height:7.4},
  {id:'bay-front-left',roomId:'living',axis:'x',fixed:61,center:18.25,width:2.9,sill:1.3,height:7.3},
  {id:'bay-front-right',roomId:'living',axis:'x',fixed:61,center:21.75,width:2.9,sill:1.3,height:7.3},
  {id:'bay-return-left',roomId:'living',axis:'z',fixed:16,center:59.5,width:1.9,sill:1.3,height:7.3},
  {id:'bay-return-right',roomId:'living',axis:'z',fixed:24,center:59.5,width:1.9,sill:1.3,height:7.3},
  {id:'wood-bath',roomId:'main-bath',axis:'z',fixed:4,center:35.4,width:2.3,sill:3.2,height:4.6,finish:'wood',frosted:true},
  {id:'office-bath',roomId:'office-bath',axis:'z',fixed:0,center:41.9,width:2.2,sill:3.7,height:3.5,frosted:true},
];

export function openingsOnWall(p:number[],q:number[],windows=mainWindows) {
  const axis=p[1]===q[1]?'x':'z',fixed=axis==='x'?p[1]:p[0];
  const lo=Math.min(axis==='x'?p[0]:p[1],axis==='x'?q[0]:q[1]);
  const hi=Math.max(axis==='x'?p[0]:p[1],axis==='x'?q[0]:q[1]);
  return windows.filter(w=>w.axis===axis&&w.fixed===fixed&&w.center-w.width/2>=lo&&w.center+w.width/2<=hi).sort((a,b)=>a.center-b.center);
}

export function solidWallRuns(lo:number,hi:number,openings:WindowSpec[]) {
  const runs:{center:number;width:number}[]=[];
  let cursor=lo;
  for(const opening of [...openings].sort((a,b)=>a.center-b.center)){
    const start=opening.center-opening.width/2,end=opening.center+opening.width/2;
    if(start<cursor||end>hi)throw new Error('Window openings overlap or leave their wall');
    if(start>cursor)runs.push({center:(cursor+start)/2,width:start-cursor});
    cursor=end;
  }
  if(cursor<hi)runs.push({center:(cursor+hi)/2,width:hi-cursor});
  return runs;
}
