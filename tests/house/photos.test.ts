import { describe,expect,it } from 'vitest';
import { existsSync,statSync } from 'node:fs';
import { photoReferences,photoWalkStops } from '../../src/house/photoReferences';
import { walkthroughPhotos } from '../../src/house/walkthroughPhotos';

describe('Walkthrough assets',()=>{
  it('ships every mapped photo once, including 18 chronologically ordered walkthrough stills',()=>{
    expect(walkthroughPhotos).toHaveLength(18);
    expect(new Set(photoReferences.map(p=>p.id)).size).toBe(photoReferences.length);
    expect(photoWalkStops.every(p=>p.roomId!==null)).toBe(true);
    let last=-1;
    for(const photo of walkthroughPhotos){
      expect(photo.time!).toBeGreaterThan(last);last=photo.time!;
      expect(photo.view).toBeDefined();
      for(const n of Object.values(photo.view!))expect(Number.isFinite(n)).toBe(true);
    }
    for(const photo of photoReferences){
      const path=`public/house/photos/${photo.id}.jpg`;
      expect(existsSync(path),path).toBe(true);
      expect(statSync(path).size).toBeLessThan(2_000_000);
    }
  });
});
