import { describe, expect, it } from 'vitest';
import * as T from 'three';
import { partitions, rooms } from '../../src/house/layout';
import { addPersonalFurniture } from '../../src/house/personalFurniture';

describe('Recovered interior plan', () => {
  it('keeps door openings inside their wall runs and room jumps clear of partitions', () => {
    for (const [level, walls] of partitions.entries()) {
      const blockers: {x:number;z:number;w:number;d:number}[]=[];
      for (const [x,z,w,d,door,gap=3] of walls) {
        expect(w).toBeGreaterThan(0); expect(d).toBeGreaterThan(0);
        if(door === undefined) {blockers.push({x,z,w,d});continue;}
        const horizontal=w>d,start=(horizontal?x:z)-(horizontal?w:d)/2,end=start+(horizontal?w:d);
        expect(door-gap/2).toBeGreaterThanOrEqual(start-.001);
        expect(door+gap/2).toBeLessThanOrEqual(end+.001);
        const a=door-gap/2-start,b=end-door-gap/2;
        if(a>0) blockers.push({x:horizontal?start+a/2:x,z:horizontal?z:start+a/2,w:horizontal?a:w,d:horizontal?d:a});
        if(b>0) blockers.push({x:horizontal?door+gap/2+b/2:x,z:horizontal?z:door+gap/2+b/2,w:horizontal?b:w,d:horizontal?d:b});
      }
      for(const room of rooms.filter(r=>r.level===level)) {
        expect(blockers.some(b=>Math.abs(room.x-b.x)<b.w/2+.28&&Math.abs(room.z-b.z)<b.d/2+.28),room.name+' must not spawn in a wall').toBe(false);
      }
    }
  });

  it('builds finite furniture geometry in meter units, with the office cabinet on the outer wall', () => {
    const parent=new T.Group(),layer=addPersonalFurniture(parent);
    parent.updateMatrixWorld(true);
    const bounds=new T.Box3().setFromObject(layer);
    for(const v of [...bounds.min.toArray(),...bounds.max.toArray()]) expect(Number.isFinite(v)).toBe(true);
    expect(bounds.max.x).toBeLessThan(26*.3048);
    expect(bounds.max.z).toBeLessThan(62*.3048);
    const cabinet=parent.getObjectByName('Navy cabinet doors')!;
    const position=cabinet.getWorldPosition(new T.Vector3());
    expect(position.x/.3048).toBeLessThan(1.5);
    expect(position.z/.3048).toBeGreaterThan(47);
    for(const name of ['Kitchen stacked laundry cupboard','Kitchen L-shaped fluted banquette','Primary bedroom — video-confirmed room','Pair of dark dressers and blue prints','Spare room — drying and storage, no inferred bed','Wood-paneled bathroom — walkthrough finishes','Office bathroom — white and natural wood']) expect(parent.getObjectByName(name)).toBeDefined();
    const desk=parent.getObjectByName('Walnut desk with monitor')!;
    expect(desk.position.x/.3048).toBe(8.5);
    expect(desk.rotation.y).toBe(-Math.PI/2);
    layer.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.Line){o.geometry.dispose();for(const material of Array.isArray(o.material)?o.material:[o.material])material.dispose();}});
  });
});
