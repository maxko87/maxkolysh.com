import { useEffect, useRef, useState } from 'react';
import { Button } from './Button';
import { Box, Footprints, Layers, ArrowUpRight, Download, ImageIcon, X, Play, Pause, Camera, ChevronLeft, ChevronRight, Sofa } from 'lucide-react';
import { createHouseViewer, rooms, type HouseViewer } from './model';
import { photoReferences, photoUrl, photoWalkStops, type PhotoReference } from './photoReferences';
import { PhotoWalk } from './PhotoWalk';

export default function HousePage() {
  const mount = useRef<HTMLDivElement>(null);
  const viewer = useRef<HouseViewer | null>(null);
  const [level, setLevel] = useState(0);
  const [mode, setMode] = useState('dollhouse');
  const [selected, setSelected] = useState('living');
  const [panel, setPanel] = useState(false);
  const [tour, setTour] = useState(false);
  const [error, setError] = useState('');
  const [furniture, setFurniture] = useState<'personal' | 'staging'>('personal');
  const [photoIndex, setPhotoIndex] = useState(0);
  const [comparison, setComparison] = useState<PhotoReference | null>(null);
  const [opacity, setOpacity] = useState(75);
  const [walkPhoto, setWalkPhoto] = useState<PhotoReference | null>(null);

  useEffect(() => {
    try { viewer.current = createHouseViewer(mount.current!, {
      roomIds: [...new Set(photoWalkStops.map(p => p.roomId!))],
      onSelect: id => openPhotoWalk(photoWalkStops.find(p => p.roomId===id)!),
    }); }
    catch { setError('The 3D view needs WebGL. Try a browser with hardware acceleration enabled.'); }
    return () => viewer.current?.dispose();
  }, []);

  useEffect(() => { viewer.current?.setInputEnabled(!walkPhoto && !comparison && !panel); }, [walkPhoto, comparison, panel]);

  function openPhotoWalk(photo: PhotoReference) {
    compare(photo); setComparison(null); setWalkPhoto(photo);
  }

  function enter(id: string) {
    setSelected(id); setMode('walk'); setPhotoIndex(0); setComparison(null);
    viewer.current?.visit(id);
  }
  function overview() {
    setMode('dollhouse'); setTour(false); setComparison(null);
    viewer.current?.overview();
  }
  function changeLevel(i: number) {
    setLevel(i); setSelected(i ? 'lower-living' : 'living'); setMode('dollhouse');
    setTour(false); setComparison(null); setPhotoIndex(0);
    viewer.current?.setLevel(i);
  }
  function compare(photo: PhotoReference) {
    if (!photo.roomId) return;
    const room = rooms.find(r => r.id === photo.roomId);
    if (!room) return;
    setTour(false); setPanel(false); setSelected(room.id); setLevel(room.level);
    setMode('walk'); setComparison(photo);
    const index = photoReferences.filter(p => p.roomId === room.id).findIndex(p => p.id === photo.id);
    setPhotoIndex(Math.max(0, index));
    if (photo.view) viewer.current?.matchPhoto(room.id, photo.view);
    else viewer.current?.visit(room.id);
  }
  function chooseFurniture(value: 'personal' | 'staging') {
    setFurniture(value); viewer.current?.setFurniture(value);
  }

  useEffect(() => {
    if (!tour) return;
    const stops = rooms.filter(r => r.level === level);
    let i = 0;
    enter(stops[0].id);
    const timer = setInterval(() => { i = (i + 1) % stops.length; enter(stops[i].id); }, 6500);
    return () => clearInterval(timer);
  }, [tour, level]);

  useEffect(() => {
    if (!panel && !comparison) return;
    const close = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setPanel(false); setComparison(null); }
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [panel, comparison]);

  const matchedPhotos = photoReferences.filter(p => p.roomId === selected);
  const activePhoto = matchedPhotos[photoIndex % Math.max(1, matchedPhotos.length)];
  const roomName = rooms.find(r => r.id === selected)?.name;

  return <main className="house-app">
    <header className="topbar">
      <div className="brand"><Box/><div><h1>716 Douglass</h1><p>A home, in three dimensions</p></div></div>
      <span className="revision">● Updated from your September walkthrough</span>
      <Button variant="outline" onClick={async () => {
        try { await viewer.current?.download(); }
        catch { setError('Export failed. Please try again.'); }
      }}><Download/><span>Export for Blender</span></Button>
    </header>

    <section className="workspace">
      <div ref={mount} className="viewport" aria-label="Interactive 3D house model"/>
      {comparison && <div className="photo-overlay" aria-label="Photo comparison overlay">
        <img src={photoUrl(comparison.id)} alt={comparison.title} style={{ opacity: opacity / 100 }}/>
        <div className="overlay-controls">
          <div><strong>{comparison.title}</strong><small>Visual reference · approximate view match</small></div>
          <label>Photo <input type="range" min="0" max="100" value={opacity} onChange={e => setOpacity(Number(e.target.value))} aria-label="Photo overlay opacity"/><span>{opacity}%</span></label>
          <Button variant="outline" aria-label="Close photo overlay" onClick={() => setComparison(null)}><X/></Button>
        </div>
      </div>}

      <div className="toolbar">
        <div className="segmented">
          <Button variant={mode === 'dollhouse' ? 'default' : 'ghost'} onClick={overview}><Box/>Dollhouse</Button>
          <Button variant={mode === 'walk' ? 'default' : 'ghost'} onClick={() => { setTour(false); enter(level ? 'lower-living' : 'living'); }}><Footprints/>Walk inside</Button>
        </div>
        <Button variant="outline" disabled={!photoWalkStops.some(p => p.roomId===selected)} onClick={() => openPhotoWalk(photoWalkStops.find(p => p.roomId===selected)!)}><Camera/>Photo walk</Button>
        <Button variant="outline" onClick={() => { setComparison(null); setTour(!tour); }}>{tour ? <Pause/> : <Play/>}{tour ? 'Pause tour' : 'Guided tour'}</Button>
      </div>

      <aside className="level-card">
        <p className="eyebrow">EXPLORE THE HOUSE</p><h2>Welcome home.</h2>
        <p className="intro">Your plan, photos & walkthrough.<br/>Click a ◎ to enter a real photo.</p>
        <div className="levels">{['Main level', 'Lower level'].map((name, i) =>
          <Button key={name} variant={level === i ? 'default' : 'ghost'} onClick={() => changeLevel(i)}><Layers/><span>{name}<small>Unit {i + 1} · {i ? '822' : '1,244'} sq ft</small></span></Button>
        )}</div>
        <p className="eyebrow room-heading">JUMP TO A ROOM</p>
        <nav aria-label="Rooms">{rooms.filter(r => r.level === level).map((r, i) =>
          <Button key={r.id} variant="ghost" className={'room ' + (mode === 'walk' && selected === r.id ? 'active' : '')} onClick={() => { setTour(false); enter(r.id); }}>
            <span className="index">0{i + 1}</span>{r.name}{photoReferences.some(p => p.roomId === r.id) ? <Camera/> : <ArrowUpRight/>}
          </Button>
        )}</nav>
        <div className="reference-link"><Button variant="ghost" onClick={() => setPanel(true)}><ImageIcon/>Photo map & original plan<ArrowUpRight/></Button></div>
      </aside>

      {!comparison && <aside className="photo-card">
        <div className="photo-card-heading"><Camera/><span>YOUR PHOTO MATCH</span></div>
        {activePhoto ? <>
          <button className="photo-preview" onClick={() => compare(activePhoto)} aria-label={'Compare ' + activePhoto.title}>
            <img src={photoUrl(activePhoto.id)} alt={activePhoto.title}/><span>Overlay on model ↗</span>
          </button>
          <div className="photo-card-copy"><h3>{activePhoto.title}</h3><p>{activePhoto.date} · {activePhoto.confidence === 'High' ? 'Room matched' : 'Likely room match'}</p></div>
          <Button className="photo-walk-launch" variant="outline" onClick={() => openPhotoWalk(photoWalkStops.find(p => p.roomId===selected)!)}><Camera/>Enter photo walk</Button>
          <div className="photo-card-nav">
            <Button variant="ghost" aria-label="Previous room photo" disabled={matchedPhotos.length < 2} onClick={() => setPhotoIndex((photoIndex + matchedPhotos.length - 1) % matchedPhotos.length)}><ChevronLeft/></Button>
            <span>{photoIndex % matchedPhotos.length + 1} / {matchedPhotos.length}</span>
            <Button variant="ghost" aria-label="Next room photo" disabled={matchedPhotos.length < 2} onClick={() => setPhotoIndex((photoIndex + 1) % matchedPhotos.length)}><ChevronRight/></Button>
          </div>
        </> : <div className="photo-card-copy"><h3>{roomName}</h3><p>No photo confidently assigned yet. This room still uses approximate staging.</p><Button variant="link" onClick={() => setPanel(true)}>See unplaced references</Button></div>}
      </aside>}

      {level === 0 && <div className="furniture-switch">
        <Sofa/><Button variant={furniture === 'personal' ? 'default' : 'ghost'} onClick={() => chooseFurniture('personal')}>Your furniture</Button>
        <Button variant={furniture === 'staging' ? 'default' : 'ghost'} onClick={() => chooseFurniture('staging')}>Original staging</Button>
      </div>}
      <div className="caption">
        <span className="eyebrow">{mode === 'walk' ? 'INSIDE THE HOUSE' : 'OPEN ROOF · EXPLORATION VIEW'}</span>
        <h2>{mode === 'walk' ? roomName : level ? 'The lower level' : 'The main level'}</h2>
        <p>{mode === 'walk' ? 'Drag to look · WASD or arrow keys to move' : 'Drag to orbit · scroll to zoom · right-drag to pan'}</p>
      </div>
      {mode === 'walk' && <div className="walk-controls">{[['↶', 'left'], ['↑', 'forward'], ['↓', 'back'], ['↷', 'right']].map(([label, dir]) =>
        <Button key={dir} variant="outline" aria-label={dir} onPointerDown={() => viewer.current?.move(dir, true)} onPointerUp={() => viewer.current?.move(dir, false)} onPointerLeave={() => viewer.current?.move(dir, false)}>{label}</Button>
      )}</div>}
      {error && <div role="alert" className="error">{error}<a href="/house/references/floor-plan.jpg" target="_blank" rel="noreferrer">Open original plan</a></div>}
      {walkPhoto && <PhotoWalk photo={walkPhoto} onSelect={openPhotoWalk} onClose={() => setWalkPhoto(null)}/>}
    </section>

    <footer><span>● Interior layout revised · {photoReferences.length} references</span><span>Dimensions & photo alignment approximate</span><Button variant="link" onClick={() => setPanel(true)}>Photo map<ArrowUpRight/></Button></footer>

    {panel && <div className="modal-backdrop" onClick={() => setPanel(false)}>
      <section className="reference-panel" role="dialog" aria-modal="true" aria-label="Photo map and model references" onClick={e => e.stopPropagation()}>
        <Button autoFocus className="close" variant="outline" aria-label="Close references" onClick={() => setPanel(false)}><X/></Button>
        <p className="eyebrow">YOUR HOUSE, THROUGH YOUR PHOTOS</p><h2>Your photos, mapped to rooms.</h2>
        <p>{photoReferences.length} selected references, including a recovered February floor plan and available video stills. The wider search reviewed 558 additional candidates beyond the first location-tagged set. The plan establishes room connections; the photographs establish furniture and finishes.</p>
        <div className="revision-notes"><h3>What changed in this reconstruction</h3><p>The September walkthrough adds 18 connected photo stops and confirms the primary bedroom, spare room, kitchen laundry cupboard, nook bench, dining bench, office desk wall and both bathroom finishes. Photo walk links these real views over the estimated 3D camera, with zoom and a fade-to-model control.</p><p>The exercise room, older dark-bedroom photograph and “Lefty/Righty” measurements still need exact room confirmation. Interior dimensions, camera alignment and garden scale remain approximate. The lower level was not shown in this video.</p></div>
        <a href={photoUrl('interior-plan')} target="_blank" rel="noreferrer"><img className="interior-plan" src={photoUrl('interior-plan')} alt="Recovered listing floor plan showing interior rooms, doors, closets and garden"/></a>
        <p>The 3D furniture captures visible shape, color and placement. Sizes and camera angles are estimated; photo overlays are visual references, not a calibrated 3D scan. Older and newer views are dated so changes in furniture remain visible.</p>
        <div className="mapped-photos">{photoReferences.map(photo =>
          <article key={photo.id} className="mapped-photo">
            <a href={photoUrl(photo.id)} target="_blank" rel="noreferrer"><img loading="lazy" src={photoUrl(photo.id)} alt={photo.title}/></a>
            <div className="mapped-photo-content"><span className={'match-label ' + (photo.confidence === 'Unplaced' ? 'unplaced' : '')}>{photo.confidence === 'Unplaced' ? 'Position unconfirmed' : photo.confidence + ' confidence'} · {photo.date}</span>
              <h3>{photo.title}</h3><p>{photo.evidence}</p>
              {photo.furniture.length > 0 && <p className="furniture-list">{photo.furniture.join(' · ')}</p>}
              {photo.roomId && <Button variant="outline" onClick={() => compare(photo)}><Camera/>Show in room<ArrowUpRight/></Button>}
            </div>
          </article>
        )}</div>
        <h2>The original floor outline.</h2>
        <p>Exterior dimensions come from the February 2026 appraisal. Interior topology now follows the recovered listing plan above; its positions are scaled approximately to this outline. Heights and alignment between floors are still estimated. Unconfirmed bedroom photographs have not been used to relocate a room.</p>
        <a href="/house/references/floor-plan.jpg" target="_blank" rel="noreferrer"><img className="plan" loading="lazy" src="/house/references/floor-plan.jpg" alt="Appraisal sketch of both levels"/></a>
        <p>Export for Blender includes the selected furniture layer, with both levels in meters.</p>
        <Button onClick={() => setPanel(false)}>Back to the house</Button>
      </section>
    </div>}
  </main>;
}
