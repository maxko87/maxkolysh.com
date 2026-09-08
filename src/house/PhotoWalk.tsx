import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Camera, Minus, Plus, RotateCcw, X } from 'lucide-react';
import { Button } from './Button';
import { rooms } from './layout';
import { photoUrl, photoWalkStops, type PhotoReference } from './photoReferences';

export function PhotoWalk({ photo, onSelect, onClose }: {
  photo: PhotoReference; onSelect: (photo: PhotoReference) => void; onClose: () => void;
}) {
  const root = useRef<HTMLElement>(null);
  const drag = useRef<{x:number;y:number;px:number;py:number} | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({x:0,y:0});
  const [opacity, setOpacity] = useState(100);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const stops=photoWalkStops.filter(p=>(p.source==='listing')===(photo.source==='listing'));
  const index = stops.findIndex(p => p.id === photo.id);
  const step = (delta: number) => onSelect(stops[(index + delta + stops.length) % stops.length]);
  const reset = () => { setZoom(1); setPan({x:0,y:0}); };

  useEffect(() => { reset(); setFailed(false); setLoaded(false); }, [photo.id]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    root.current?.focus();
    return () => previous?.focus();
  }, []);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
      if (!(event.target instanceof HTMLInputElement) && ['ArrowLeft','ArrowRight'].includes(event.key)) {
        event.preventDefault(); step(event.key === 'ArrowRight' ? 1 : -1);
      }
      if (event.key === 'Tab') {
        const controls = [...(root.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input') ?? [])];
        const first=controls[0],last=controls.at(-1);
        if (event.shiftKey && (document.activeElement===first || document.activeElement===root.current)) {event.preventDefault();last?.focus();}
        else if (!event.shiftKey && (document.activeElement===last || document.activeElement===root.current)) {event.preventDefault();first?.focus();}
      }
    };
    window.addEventListener('keydown',key);
    return () => window.removeEventListener('keydown',key);
  });
  // Preload only adjacent stops, not the entire photograph collection.
  useEffect(() => {
    for (const d of [-1,1]) { const img=new Image(); img.src=photoUrl(stops[(index+d+stops.length)%stops.length].id); }
  }, [index]);
  const room = rooms.find(r => r.id === photo.roomId);

  return <section ref={root} tabIndex={-1} className="photo-walk" role="dialog" aria-modal="true" aria-label="Photo walk">
    <div className="photo-walk-shade" style={{opacity:opacity/100}}/>
    <div className="photo-walk-image" onPointerDown={e => {
      if (zoom<=1) return;
      drag.current={x:e.clientX,y:e.clientY,px:pan.x,py:pan.y}; e.currentTarget.setPointerCapture(e.pointerId);
    }} onPointerMove={e => {
      if (!drag.current) return;
      const rect=e.currentTarget.getBoundingClientRect(), limitX=rect.width*(zoom-1)/2,limitY=rect.height*(zoom-1)/2;
      setPan({x:Math.max(-limitX,Math.min(limitX,drag.current.px+e.clientX-drag.current.x)),y:Math.max(-limitY,Math.min(limitY,drag.current.py+e.clientY-drag.current.y))});
    }} onPointerUp={() => {drag.current=null;}} onPointerCancel={() => {drag.current=null;}} onLostPointerCapture={() => {drag.current=null;}}>
      {!failed && <img key={photo.id} src={photoUrl(photo.id)} alt={photo.title} draggable={false}
        onLoad={() => setLoaded(true)} onError={() => setFailed(true)}
        style={{opacity:loaded ? opacity/100 : 0,transform:`translate(${pan.x}px, ${pan.y}px) scale(${zoom})`}}/>}
      {(!loaded || failed) && <p className="photo-walk-status" role="status">{failed ? 'This photo could not load. Try the next view.' : 'Loading photo…'}</p>}
    </div>
    <header className="photo-walk-header">
      <div><span><Camera/> {photo.source==='listing'?'ORIGINAL STAGING':'PHOTO WALK'} · {room?.name}</span><h2 aria-live="polite">{photo.title}</h2>
        <p>{photo.date}{photo.time!==undefined ? ` · video ${Math.floor(photo.time/60)}:${String(Math.floor(photo.time%60)).padStart(2,'0')}` : ' · photo archive'} · estimated viewpoint</p></div>
      <Button variant="outline" onClick={onClose} aria-label="Return to 3D"><X/><span>3D model</span></Button>
    </header>
    <div className="photo-walk-tools">
      <Button variant="outline" aria-label="Zoom out" disabled={zoom<=1} onClick={() => {setZoom(Math.max(1,zoom-.5));setPan({x:0,y:0});}}><Minus/></Button>
      <span>{zoom.toFixed(1)}×</span>
      <Button variant="outline" aria-label="Zoom in" disabled={zoom>=3} onClick={() => setZoom(Math.min(3,zoom+.5))}><Plus/></Button>
      <Button variant="outline" aria-label="Reset photo view" onClick={reset}><RotateCcw/></Button>
      <label>Reveal 3D <input aria-label="Photo walk opacity" type="range" min="0" max="100" value={opacity} onChange={e => setOpacity(Number(e.target.value))}/></label>
    </div>
    <div className="photo-walk-bottom">
      <div className="photo-walk-navigation">
        <Button variant="outline" onClick={() => step(-1)} aria-label="Previous photo walk stop"><ArrowLeft/><span>Back</span></Button>
        <div><strong>{index+1} / {stops.length}</strong><p>Real stills, not 360° · zoom, then drag to inspect</p></div>
        <Button variant="outline" onClick={() => step(1)} aria-label="Next photo walk stop"><span>Next view</span><ArrowRight/></Button>
      </div>
      <nav className="photo-walk-rooms" aria-label="Photo walk rooms">{rooms.filter(r => stops.some(p => p.roomId===r.id)).map(r =>
        <button key={r.id} aria-current={photo.roomId===r.id ? 'location' : undefined} onClick={() => onSelect(stops.find(p => p.roomId===r.id)!)}>{r.name}</button>
      )}</nav>
    </div>
  </section>;
}
