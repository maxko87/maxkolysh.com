import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import HousePage from '../../src/house/HousePage';
import { photoReferences } from '../../src/house/photoReferences';
import { overviewFov, rooms } from '../../src/house/model';
import { compactQuery } from '../../src/house/useCompactLayout';

const viewer = vi.hoisted(() => ({
  dispose: vi.fn(), visit: vi.fn(), overview: vi.fn(), setLevel: vi.fn(),
  setFurniture: vi.fn(), matchPhoto: vi.fn(), move: vi.fn(), download: vi.fn(),
  setInputEnabled: vi.fn(),
}));
vi.mock('../../src/house/model', async importOriginal => {
  const original = await importOriginal<typeof import('../../src/house/model')>();
  return { ...original, createHouseViewer: () => viewer };
});
beforeEach(() => vi.clearAllMocks());
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('House on a phone', () => {
  function compactScreen() {
    let notify = () => {};
    const query = { matches: true, addEventListener: vi.fn((_event, callback: () => void) => { notify = callback; }), removeEventListener: vi.fn() };
    const matchMedia = vi.fn(() => query);
    vi.stubGlobal('matchMedia', matchMedia);
    return { query, matchMedia, resize: (matches: boolean) => act(() => { query.matches = matches; notify(); }) };
  }

  it('starts with an unobstructed model and closes the room sheet after a room selection', () => {
    const device = compactScreen();
    render(<HousePage />);
    expect(device.matchMedia).toHaveBeenCalledWith(compactQuery);
    expect(screen.queryByRole('navigation', {name: 'Rooms'})).not.toBeInTheDocument();
    const toggle = screen.getByRole('button', {name: /Rooms & options/});
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(toggle);
    expect(screen.getByRole('dialog', {name: 'Rooms & options'})).toHaveFocus();
    expect(viewer.setInputEnabled).toHaveBeenLastCalledWith(false);
    fireEvent.click(screen.getByRole('button', {name: /Front office/}));
    expect(viewer.visit).toHaveBeenLastCalledWith('front-bed');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(toggle).toHaveFocus();
    expect(viewer.setInputEnabled).toHaveBeenLastCalledWith(true);
    expect(screen.getByRole('button', {name: 'strafe-left'})).toBeInTheDocument();
  });

  it('keeps both floors, furniture layers and reference photos available inside the sheet', () => {
    compactScreen();
    render(<HousePage />);
    fireEvent.click(screen.getByRole('button', {name: /Rooms & options/}));
    fireEvent.click(screen.getByRole('button', {name: /Lower level/}));
    expect(viewer.setLevel).toHaveBeenLastCalledWith(1);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Provisional lower level'})).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'Original staging'}));
    expect(viewer.setFurniture).toHaveBeenLastCalledWith('staging');
    fireEvent.click(screen.getByRole('button', {name: /Photo map & original plan/}));
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(screen.getByRole('dialog', {name: 'Photo map and model references'})).toBeInTheDocument();
    expect(viewer.setInputEnabled).toHaveBeenLastCalledWith(false);
  });

  it('traps sheet focus, dismisses on Escape, and restores the desktop controls on resize', () => {
    const device = compactScreen();
    const {unmount} = render(<HousePage />);
    fireEvent.click(screen.getByRole('button', {name: /Rooms & options/}));
    fireEvent.keyDown(window, {key: 'Tab'});
    expect(screen.getByRole('button', {name: 'Close rooms and options'})).toHaveFocus();
    fireEvent.keyDown(window, {key: 'Escape'});
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(viewer.setInputEnabled).toHaveBeenLastCalledWith(true);
    device.resize(false);
    expect(screen.queryByRole('button', {name: /Rooms & options/})).not.toBeInTheDocument();
    expect(screen.getByRole('navigation', {name: 'Rooms'})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Your furniture'})).toBeInTheDocument();
    unmount();
    expect(device.query.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('releases touch movement on cancellation and capture loss, and supports a keyboard', () => {
    compactScreen();
    render(<HousePage />);
    fireEvent.click(screen.getByRole('button', {name: 'Walk inside'}));
    const forward = screen.getByRole('button', {name: 'forward'});
    fireEvent.pointerDown(forward, {pointerId: 1});
    expect(viewer.move).toHaveBeenLastCalledWith('forward', true);
    fireEvent.pointerCancel(forward, {pointerId: 1});
    expect(viewer.move).toHaveBeenLastCalledWith('forward', false);
    fireEvent.pointerDown(forward, {pointerId: 2});
    fireEvent.lostPointerCapture(forward, {pointerId: 2});
    expect(viewer.move).toHaveBeenLastCalledWith('forward', false);
    fireEvent.keyDown(forward, {key: ' '});
    expect(viewer.move).toHaveBeenLastCalledWith('forward', true);
    fireEvent.keyUp(forward, {key: ' '});
    expect(viewer.move).toHaveBeenLastCalledWith('forward', false);
  });

  it('opens the photo walk from the compact toolbar and returns to the model', () => {
    compactScreen();
    render(<HousePage />);
    fireEvent.click(screen.getByRole('button', {name: 'Photo walk'}));
    expect(screen.getByRole('dialog', {name: 'Photo walk'})).toBeInTheDocument();
    expect(viewer.setInputEnabled).toHaveBeenLastCalledWith(false);
    fireEvent.click(screen.getByRole('button', {name: 'Next photo walk stop'}));
    fireEvent.click(screen.getByRole('button', {name: 'Return to 3D'}));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(viewer.setInputEnabled).toHaveBeenLastCalledWith(true);
  });

  it('preserves horizontal framing on portrait screens without changing desktop framing', () => {
    for (const aspect of [320 / 640, 390 / 788, 768 / 968]) {
      const vertical = overviewFov(aspect) * Math.PI / 180;
      const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * aspect) * 180 / Math.PI;
      expect(horizontal).toBeCloseTo(42);
      expect(overviewFov(aspect)).toBeGreaterThan(42);
    }
    expect(overviewFov(844 / 334)).toBeCloseTo(42);
    expect(overviewFov(0)).toBeLessThan(180);
  });
});

describe('House photo references', () => {
  it('only assigns references to existing rooms and keeps uncertain locations unplaced', () => {
    for (const photo of photoReferences) {
      if (photo.roomId) expect(rooms.some(room => room.id === photo.roomId)).toBe(true);
      if (photo.confidence === 'Unplaced') expect(photo.roomId).toBeNull();
    }
    expect(photoReferences.find(photo => photo.id === 'bedroom-dressers')?.roomId).toBe('rear-bed');
  });

  it('matches the selected photo viewpoint and exposes adjustable opacity', () => {
    render(<HousePage />);
    fireEvent.click(screen.getByRole('button', { name: 'Compare Living room · sofa wall' }));
    expect(viewer.matchPhoto).toHaveBeenCalledWith('living', photoReferences[0].view);
    const overlay = screen.getByLabelText('Photo comparison overlay');
    fireEvent.change(screen.getByRole('slider'), { target: { value: '25' } });
    expect(within(overlay).getByRole('img')).toHaveStyle({ opacity: '0.25' });
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByLabelText('Photo comparison overlay')).not.toBeInTheDocument();
  });

  it('switches furniture layers without losing room navigation', () => {
    render(<HousePage />);
    fireEvent.click(screen.getByRole('button', { name: 'Original staging' }));
    expect(viewer.setFurniture).toHaveBeenLastCalledWith('staging');
    fireEvent.click(screen.getByRole('button', { name: 'Your furniture' }));
    expect(viewer.setFurniture).toHaveBeenLastCalledWith('personal');
    fireEvent.click(screen.getByRole('button', { name: /Front office/ }));
    expect(viewer.visit).toHaveBeenCalledWith('front-bed');
    expect(screen.getByText(/2026-06-17 · Room matched/)).toBeInTheDocument();
  });

  it('shows an honest empty state on the lower level', () => {
    render(<HousePage />);
    fireEvent.click(screen.getByRole('button', { name: /Lower level/ }));
    expect(viewer.setLevel).toHaveBeenCalledWith(1);
    expect(screen.getByText(/No photo confidently assigned yet/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Your furniture' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', {name:'Provisional lower level'})).toBeInTheDocument();
  });

  it('does not provide a room-placement action for unplaced bedroom photos', () => {
    render(<HousePage />);
    fireEvent.click(screen.getByRole('button', { name: /Photo map & original plan/ }));
    const heading = screen.getByRole('heading', { name: 'Bedroom · dark bedding and art ledge' });
    expect(within(heading.closest('article')!).queryByRole('button')).not.toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('walks through real photographs, jumps between rooms and restores 3D controls', () => {
    render(<HousePage/>);
    fireEvent.click(screen.getByRole('button',{name:'Photo walk'}));
    const dialog=screen.getByRole('dialog',{name:'Photo walk'});
    expect(viewer.setInputEnabled).toHaveBeenLastCalledWith(false);
    fireEvent.click(within(dialog).getByRole('button',{name:'Kitchen & nook'}));
    expect(within(dialog).getByRole('heading',{name:'Kitchen nook'})).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button',{name:'Next photo walk stop'}));
    expect(within(dialog).getByRole('heading',{name:'Out to the rear deck'})).toBeInTheDocument();
    fireEvent.keyDown(dialog,{key:'ArrowLeft'});
    expect(within(dialog).getByRole('heading',{name:'Kitchen nook'})).toBeInTheDocument();
    const img=within(dialog).getByRole('img');fireEvent.load(img);
    fireEvent.change(within(dialog).getByRole('slider'),{target:{value:'35'}});
    expect(img).toHaveStyle({opacity:'.35'});
    fireEvent.click(within(dialog).getByRole('button',{name:'Zoom in'}));
    expect(img).toHaveStyle({transform:'translate(0px, 0px) scale(1.5)'});
    fireEvent.keyDown(dialog,{key:'Escape'});
    expect(screen.queryByRole('dialog',{name:'Photo walk'})).not.toBeInTheDocument();
    expect(viewer.setInputEnabled).toHaveBeenLastCalledWith(true);
  });

  it('shows a recoverable photo-load failure and resets it at the next stop', () => {
    render(<HousePage/>);
    fireEvent.click(screen.getByRole('button',{name:'Photo walk'}));
    const dialog=screen.getByRole('dialog',{name:'Photo walk'});
    fireEvent.error(within(dialog).getByRole('img'));
    expect(within(dialog).getByRole('status')).toHaveTextContent('could not load');
    fireEvent.click(within(dialog).getByRole('button',{name:'Next photo walk stop'}));
    expect(within(dialog).getByRole('img')).toBeInTheDocument();
    expect(within(dialog).getByRole('status')).toHaveTextContent('Loading');
  });

  it('shows listing references for original staging and never labels them current downstairs',()=>{
    render(<HousePage/>);
    fireEvent.click(screen.getByRole('button',{name:'Original staging'}));
    expect(screen.getByRole('heading',{name:'Listing · white sofa and checked rug'})).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Photo walk'}));
    expect(screen.getByRole('dialog',{name:'Photo walk'})).toHaveTextContent('Listing · white sofa');
    const photoDialog=screen.getByRole('dialog',{name:'Photo walk'});
    fireEvent.click(within(photoDialog).getByRole('button',{name:'Front office'}));
    expect(photoDialog).toHaveTextContent('Listing · oval desk and Murphy-bed wall');
    expect(viewer.setFurniture).toHaveBeenLastCalledWith('staging');
    fireEvent.keyDown(window,{key:'Escape'});
    fireEvent.click(screen.getByRole('button',{name:/Lower level/}));
    expect(screen.getByRole('heading',{name:'Listing · lower living room'})).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Provisional lower level'}));
    expect(screen.getByText(/No photo confidently assigned yet for your current arrangement/)).toBeInTheDocument();
  });
});
