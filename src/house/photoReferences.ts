export type PhotoReference = {
  id: string;
  title: string;
  roomId: string | null;
  date: string;
  confidence: 'High' | 'Likely' | 'Unplaced';
  evidence: string;
  furniture: string[];
  view?: { x: number; z: number; yaw: number; pitch: number; fov: number };
};

export const photoReferences: PhotoReference[] = [
  { id: 'living-wide', title: 'Living room · sofa wall', roomId: 'living', date: '2026-05-03', confidence: 'High', evidence: 'Bay window, vaulted wood ceiling and adjoining dining area identify the main living room.', furniture: ['White sofa', 'Slatted walnut coffee table', 'Natural woven rug', 'Cream accent chair', 'Tall arched mirrors'], view: { x: 15.5, z: 55.5, yaw: -2.25, pitch: -.12, fov: 75 } },
  { id: 'living-bay', title: 'Living room · bay seating', roomId: 'living', date: '2026-03-19', confidence: 'High', evidence: 'Three-part front window and entrance door match the front bay. This earlier view clearly shows the chaise.', furniture: ['White loveseat and chaise', 'Black leather lounge chair', 'Walnut coffee table'], view: { x: 24, z: 48.2, yaw: 2.9, pitch: -.12, fov: 75 } },
  { id: 'living-to-dining', title: 'Living toward dining', roomId: 'dining', date: '2026-06-22', confidence: 'High', evidence: 'Continuous wood ceiling, hall step, dining mirror and lounge chair connect the two spaces.', furniture: ['White slipcovered sofa', 'Black leather lounge chair and ottoman', 'Walnut dining table', 'Cream dining chairs', 'Arched dining mirror'], view: { x: 23.5, z: 56, yaw: .15, pitch: .05, fov: 78 } },
  { id: 'dining-bar', title: 'Dining room · bar and office doorway', roomId: 'dining', date: '2026-06-21', confidence: 'High', evidence: 'The doorway reveals the same navy cabinetry seen in the office photos; the hall opening is beside it.', furniture: ['Black rounded bar cabinet', 'Black leather lounge chair', 'Walnut dining table', 'Cream dining chairs'], view: { x: 22, z: 41.5, yaw: 1.25, pitch: .12, fov: 78 } },
  { id: 'kitchen-current', title: 'Kitchen · refrigerator and coffee station', roomId: 'kitchen', date: '2026-08-06', confidence: 'High', evidence: 'White cabinetry, brass hardware, scalloped backsplash and stainless refrigerator match the main kitchen.', furniture: ['Black espresso machine', 'Stainless French-door refrigerator', 'White pantry cabinetry'], view: { x: 14, z: 14, yaw: -.9, pitch: 0, fov: 72 } },
  { id: 'office-chair', title: 'Front office · chair and built-ins', roomId: 'front-bed', date: '2026-06-17', confidence: 'Likely', evidence: 'Navy shelving and the tall side window match the room visible from the living/dining doorway. Exact desk position is estimated.', furniture: ['Cream padded swivel chair', 'Navy built-in shelves', 'Walnut desk', 'Taupe curtains'], view: { x: 8, z: 50, yaw: 1.8, pitch: -.08, fov: 72 } },
  { id: 'bedroom-dressers', title: 'Bedroom · dressers and blue prints', roomId: null, date: '2026-06-20', confidence: 'Unplaced', evidence: 'The bedroom is recognizable, but the photos do not yet establish which bedroom on the plan. Furniture is recorded without assigning a position.', furniture: ['Two dark dressers with brass pulls', 'Two blue Van Gogh prints', 'Low bed with white bedding'] },
  { id: 'hallway', title: 'Main hall · toward the living room', roomId: 'hallway', date: '2026-03-30', confidence: 'High', evidence: 'The hallway terminates at the rounded black bar cabinet and front living area.', furniture: [] },
  { id: 'garden', title: 'Rear garden', roomId: null, date: '2026-04-15', confidence: 'Unplaced', evidence: 'Rear garden, outside the current interior model. Preserved as an exterior reference.', furniture: ['Yellow planter', 'Fern and bamboo planters'] },
  { id: 'measurement-sketch', title: 'Handwritten room measurements', roomId: null, date: '2026-03-19', confidence: 'Unplaced', evidence: 'The sketch labels two rooms “Lefty” and “Righty”. Their correspondence to the appraisal needs confirmation before using these dimensions.', furniture: [] },
];

export const photoUrl = (id: string) => `/house/photos/${id}.jpg`;
