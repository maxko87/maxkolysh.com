import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import HousePage from '../../src/house/HousePage';
import { photoReferences } from '../../src/house/photoReferences';
import { rooms } from '../../src/house/model';

const viewer = vi.hoisted(() => ({
  dispose: vi.fn(), visit: vi.fn(), overview: vi.fn(), setLevel: vi.fn(),
  setFurniture: vi.fn(), matchPhoto: vi.fn(), move: vi.fn(), download: vi.fn(),
}));
vi.mock('../../src/house/model', async importOriginal => {
  const original = await importOriginal<typeof import('../../src/house/model')>();
  return { ...original, createHouseViewer: () => viewer };
});
beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe('House photo references', () => {
  it('only assigns references to existing rooms and keeps uncertain locations unplaced', () => {
    for (const photo of photoReferences) {
      if (photo.roomId) expect(rooms.some(room => room.id === photo.roomId)).toBe(true);
      if (photo.confidence === 'Unplaced') expect(photo.roomId).toBeNull();
    }
    expect(photoReferences.find(photo => photo.id === 'bedroom-dressers')?.roomId).toBeNull();
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
    expect(screen.getByText(/Likely room match/)).toBeInTheDocument();
  });

  it('shows an honest empty state on the lower level', () => {
    render(<HousePage />);
    fireEvent.click(screen.getByRole('button', { name: /Lower level/ }));
    expect(viewer.setLevel).toHaveBeenCalledWith(1);
    expect(screen.getByText(/No photo confidently assigned yet/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Your furniture' })).not.toBeInTheDocument();
  });

  it('does not provide a room-placement action for unplaced bedroom photos', () => {
    render(<HousePage />);
    fireEvent.click(screen.getByRole('button', { name: /Photo map & original plan/ }));
    const heading = screen.getByRole('heading', { name: 'Bedroom · dressers and blue prints' });
    expect(within(heading.closest('article')!).queryByRole('button')).not.toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
