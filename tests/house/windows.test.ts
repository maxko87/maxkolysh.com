import {describe,it,expect} from 'vitest';
import {mainWindows,openingsOnWall,solidWallRuns} from '../../src/house/windows';
import {partitions,rooms} from '../../src/house/layout';
import {addExteriorTrees,treePositions} from '../../src/house/exteriorTrees';
import {addOriginalStaging} from '../../src/house/originalStaging';
import {addPersonalFurniture} from '../../src/house/personalFurniture';
import * as T from 'three';

describe('Window and bathroom corrections',()=>{
  it('puts both primary windows on the short return walls and splits multiple bay openings',()=>{
    const primary=mainWindows.filter(w=>w.roomId==='rear-bed');
    expect(primary.map(w=>[w.axis,w.fixed])).toEqual([['x',18.5],['x',32]]);
    const bay=openingsOnWall([16,61],[24,61]);expect(bay).toHaveLength(2);
    const runs=solidWallRuns(16,24,bay);expect(runs).toHaveLength(3);
    for(const opening of bay)expect(runs.some(r=>Math.abs(r.center-opening.center)<r.width/2)).toBe(false);
    expect(mainWindows.filter(w=>w.roomId==='living')).toHaveLength(4);
    expect(mainWindows.filter(w=>w.frosted)).toHaveLength(2);
    expect(mainWindows.filter(w=>w.roomId==='kitchen').every(w=>w.sill>3.1)).toBe(true);
    for(const w of mainWindows){expect(w.width).toBeGreaterThan(0);expect(w.sill+w.height).toBeLessThan(10.3);}
  });
  it('keeps duplicate partitions out of exterior window apertures',()=>{
    for(const w of mainWindows)for(const [x,z,width,depth] of partitions[0]){
      const wx=w.axis==='x'?w.center:w.fixed,wz=w.axis==='x'?w.fixed:w.center;
      expect(Math.abs(wx-x)<width/2&&Math.abs(wz-z)<depth/2,w.id).toBe(false);
    }
  });
  it('faces into the bathroom and provides an open recess with visible shower fixtures',()=>{
    const room=rooms.find(r=>r.id==='main-bath')!;
    expect(Math.sin(room.yaw!)).toBeGreaterThan(.8);expect(Math.cos(room.yaw!)).toBeLessThan(0);
    // There must be no opaque cross-wall across the shower entrance.
    expect(partitions[0].some(([x,z,w,d])=>Math.abs(6.6-x)<w/2&&Math.abs(39.8-z)<d/2)).toBe(false);
    const parent=new T.Group();addPersonalFurniture(parent);
    const shower=parent.getObjectByName('Main bathroom recessed shower')!;expect(shower).toBeDefined();
    for(const name of ['Main shower glass door','Main shower chrome handle','Main shower overhead arm','Main shower mixer'])expect(shower.getObjectByName(name)).toBeDefined();
    expect(new T.Box3().setFromObject(shower).max.z/.3048).toBeGreaterThan(42);
  });
  it('builds exterior foliage and keeps original staging in separate floor layers',()=>{
    const main=new T.Group(),lower=new T.Group();const trees=addExteriorTrees(main);
    expect(trees.children).toHaveLength(treePositions.length);
    let leaves=0;trees.traverse(o=>{if(o instanceof T.InstancedMesh)leaves+=o.count;});expect(leaves).toBeGreaterThan(300);
    const [staging,lowerStaging]=addOriginalStaging(main,lower);
    expect(staging.getObjectByName('Listing gray checked rug')).toBeDefined();
    expect(staging.getObjectByName('Listing walnut bay console and twin lamps')).toBeDefined();
    expect(staging.getObjectByName('Listing oval walnut office desk')).toBeDefined();
    expect(lowerStaging.getObjectByName('Listing lower honey-wood kitchen')).toBeDefined();
    expect(staging.getObjectByName('White bay loveseat with chaise')).toBeUndefined();
  });
});
