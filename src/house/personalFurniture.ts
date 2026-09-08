import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const FT = 0.3048;

/** Photo-informed furniture, in feet before conversion to the model's meter units. */
export function addPersonalFurniture(parent: T.Group) {
  const layer = new T.Group();
  layer.name = 'Personal furniture — photo-informed, dimensions approximate';
  parent.add(layer);
  const surface = (color: string, roughness = .75, metalness = 0) =>
    new T.MeshStandardMaterial({ color, roughness, metalness });
  const linen = surface('#f4efdf');
  const cushion = surface('#fff9eb');
  const walnut = surface('#69422b', .48);
  const woodEdge = surface('#9a633d', .5);
  const leather = surface('#202421', .35);
  const metal = surface('#30342f', .35, .6);
  const brass = surface('#b19655', .4, .6);
  const navy = surface('#263944');
  const screen = surface('#20272c', .2);
  const mirror = surface('#b7c9c3', .15, .75);

  function group(name: string, x: number, z: number, rotation = 0, target = layer) {
    const g = new T.Group();
    g.name = name;
    g.userData = { basis: 'Apple Photos and September 8, 2026 walkthrough', dimensions: 'estimated' };
    g.position.set(x * FT, 0, z * FT);
    g.rotation.y = rotation;
    target.add(g);
    return g;
  }
  function box(g: T.Object3D, name: string, x: number, y: number, z: number,
    w: number, h: number, d: number, material: T.Material, radius = 0) {
    const geometry = radius
      ? new RoundedBoxGeometry(w * FT, h * FT, d * FT, 3, Math.min(radius, w / 3, h / 3, d / 3) * FT)
      : new T.BoxGeometry(w * FT, h * FT, d * FT);
    const m = new T.Mesh(geometry, material);
    m.name = name;
    m.position.set(x * FT, y * FT, z * FT);
    m.castShadow = m.receiveShadow = true;
    g.add(m);
    return m;
  }
  function cylinder(g: T.Object3D, x: number, y: number, z: number,
    radius: number, height: number, material: T.Material) {
    const m = new T.Mesh(new T.CylinderGeometry(radius * FT, radius * FT, height * FT, 16), material);
    m.position.set(x * FT, y * FT, z * FT);
    m.castShadow = true;
    g.add(m);
    return m;
  }

  function sofa(x: number, z: number, width: number, rotation: number, chaise = false) {
    const g = group(chaise ? 'White bay loveseat with chaise' : 'White slipcovered sofa', x, z, rotation);
    box(g, 'Exposed wood plinth', 0, .32, 0, width, .48, 3.1, woodEdge, .07);
    box(g, 'Linen body', 0, .94, 0, width, 1.15, 3.2, linen, .18);
    box(g, 'Upholstered back', 0, 1.95, -1.25, width, 2.1, .5, linen, .22);
    for (const s of [-1, 1]) box(g, 'Rounded arm', s * (width / 2 - .24), 1.55, .1, .5, 1.25, 3.1, linen, .22);
    const count = width > 7.7 ? 3 : 2;
    const seatWidth = (width - 1) / count;
    for (let i = 0; i < count; i++) {
      const x = -width / 2 + .5 + seatWidth * (i + .5);
      box(g, 'Soft seat cushion', x, 1.5, .28, seatWidth - .09, .45, 2.65, cushion, .2);
      const back = box(g, 'Loose back cushion', x, 2.15, -.79, seatWidth - .07, 1.25, .55, cushion, .22);
      back.rotation.x = -.13;
      back.rotation.z = (i % 2 ? 1 : -1) * .025;
    }
    if (chaise) {
      box(g, 'Chaise wood base', 1.8, .32, 2.2, 3.3, .48, 2.3, woodEdge, .07);
      box(g, 'Chaise extension', 1.8, 1.1, 2.2, 3.3, 1.1, 2.4, cushion, .2);
    }
  }
  sofa(23.15, 51.7, 8.3, -Math.PI / 2);
  sofa(19.8, 58.6, 7.5, Math.PI, true);

  const rug = group('Natural woven living room rug', 19.7, 51.8);
  box(rug, 'Jute rug', 0, .045, 0, 8, .06, 11.5, surface('#ac946a'));
  for (let i = -3.9; i < 4; i += .13) box(rug, 'Woven thread', i, .08, 0, .018, .006, 11.4, surface('#baa780'));

  const table = group('Slatted walnut coffee table', 19.4, 52.2);
  box(table, 'Walnut top', 0, 1.5, 0, 3.6, .22, 3.2, walnut, .035);
  box(table, 'Lower shelf', 0, .28, 0, 3.45, .14, 3.05, walnut);
  for (const s of [-1, 1]) {
    box(table, 'Corner post', s * 1.6, .85, -1.4, .25, 1.5, .25, walnut);
    box(table, 'Corner post', s * 1.6, .85, 1.4, .25, 1.5, .25, walnut);
    for (let y = .45; y < 1.4; y += .19) box(table, 'Horizontal walnut slat', 0, y, s * 1.45, 3.3, .09, .13, woodEdge);
  }

  function lounge(x: number, z: number) {
    const g = group('Black leather and walnut lounge chair', x, z, .08);
    cylinder(g, 0, .65, 0, .1, 1.1, metal);
    for (let i = 0; i < 5; i++) {
      const leg = box(g, 'Star base', 0, .12, 0, .13, .12, 2.1, metal);
      leg.rotation.y = i * Math.PI / 5;
    }
    box(g, 'Walnut seat shell', 0, 1.1, 0, 2.65, .22, 2.6, woodEdge, .12);
    box(g, 'Black leather seat', 0, 1.4, 0, 2.45, .45, 2.45, leather, .2);
    for (const [y, h] of [[2.1, .85], [3.1, .8]]) {
      const shell = box(g, 'Curved walnut back shell', 0, y, -1, 2.35, h, .22, woodEdge, .1);
      shell.rotation.x = -.23;
      const pad = box(g, 'Tufted leather back', 0, y, -.83, 2.18, h - .03, .32, leather, .15);
      pad.rotation.x = -.23;
    }
    for (const s of [-1, 1]) box(g, 'Leather armrest', s * 1.3, 1.92, .02, .4, .34, 1.5, leather, .14);
    const foot = group('Matching leather ottoman', x, z + 2.85, .08);
    cylinder(foot, 0, .6, 0, .09, 1, metal);
    box(foot, 'Ottoman base', 0, .13, 0, 1.8, .13, 1.6, metal);
    box(foot, 'Walnut ottoman shell', 0, 1.05, 0, 2.3, .2, 1.9, woodEdge, .1);
    box(foot, 'Leather foot cushion', 0, 1.3, 0, 2.2, .4, 1.8, leather, .15);
  }
  lounge(20.6, 46.7);

  const dining = group('Walnut expandable dining table', 20.7, 39.6);
  box(dining, 'Solid wood tabletop', 0, 2.52, 0, 6.1, .2, 3.35, walnut, .035);
  for (const s of [-1, 1]) box(dining, 'Wide slab leg', s * 2.65, 1.25, 0, .65, 2.5, 3.3, walnut);
  function diningChair(x: number, z: number, rotation: number) {
    const g = group('Cream upholstered dining armchair', x, z, rotation);
    for (const a of [-1, 1]) for (const b of [-1, 1]) box(g, 'Upholstered leg', a * .63, .75, b * .6, .24, 1.5, .24, linen, .06);
    box(g, 'Cream seat', 0, 1.55, 0, 1.8, .3, 1.65, linen, .1);
    box(g, 'Open rounded back', 0, 2.5, -.7, 1.9, .45, .3, linen, .12);
    for (const s of [-1, 1]) box(g, 'Upholstered arm', s * .83, 2.14, 0, .25, .25, 1.5, linen, .09);
  }
  for (const x of [19, 22.3]) diningChair(x, 41.9, Math.PI);
  diningChair(16.8, 39.6, Math.PI / 2);
  const bench=group('Dining bench beneath the arched mirror',20.7,36.9);
  box(bench,'Walnut bench seat',0,1.6,0,6.2,.25,1.6,walnut,.05);
  for(const s of [-1,1])box(bench,'Bench slab leg',s*2.5,.8,0,.3,1.6,1.5,walnut);
  box(bench,'Pale sheepskin-style bench throw',0,1.79,0,5.7,.2,1.65,cushion,.09);

  function archedMirror(x: number, z: number, width: number, height: number, rotation: number) {
    const g = group('Black-framed arched floor mirror', x, z, rotation);
    const shape = new T.Shape();
    const r = width / 2;
    shape.moveTo(-r * FT, 0);
    shape.lineTo(r * FT, 0);
    shape.lineTo(r * FT, (height - r) * FT);
    shape.absarc(0, (height - r) * FT, r * FT, 0, Math.PI, false);
    shape.lineTo(-r * FT, 0);
    const face = new T.Mesh(new T.ShapeGeometry(shape), mirror);
    face.position.set(0, .08 * FT, .045 * FT);
    g.add(face);
    const line = new T.Line(new T.BufferGeometry().setFromPoints(shape.getPoints(48)), new T.LineBasicMaterial({ color: '#242c29' }));
    line.position.copy(face.position);
    line.position.z += .005;
    g.add(line);
  }
  archedMirror(20.6, 35.3, 4.3, 7, 0);
  archedMirror(24.7, 45.1, 2, 6.6, -Math.PI / 2);
  archedMirror(24.7, 58.1, 2.3, 7, -Math.PI / 2);

  const bar = group('Rounded black bar cabinet', 12.4, 42.5, Math.PI / 2);
  box(bar, 'Rounded cabinet top', 0, 3.3, 0, 4.5, .16, 1.5, leather, .12);
  box(bar, 'Cabinet back', 0, 1.9, -.65, 4.3, 2.5, .12, leather);
  for (const s of [-1, 1]) box(bar, 'Cabinet side', s * 2.1, 1.9, 0, .15, 2.5, 1.4, leather);
  for (let y = .75; y < 3.2; y += .8) box(bar, 'Bottle shelf', 0, y, 0, 4.2, .1, 1.4, leather);
  for (let x = -1.9; x <= 1.9; x += .64) box(bar, 'Cubbies', x, 1.85, 0, .08, 2.3, 1.4, leather);
  for (const x of [-1.5, 1.5]) cylinder(bar, x, .38, 0, .045, .7, metal);
  for (const x of [-1.3, -.3, .7]) cylinder(bar, x, 3.63, 0, .16, .6, surface('#4b6555', .3));

  // Listing plan labels the built-in/Murphy-bed wall on the outer side,
  // not the front window wall used in the first reconstruction.
  const office = group('Front office — photo-informed placement', 0, 0);
  office.position.set(57.2 * FT, 0, 47 * FT);
  office.rotation.y = -Math.PI / 2;
  box(office, 'Navy built-in cabinet back', 5.4, 4, 57.2, 8.1, 8, .16, navy);
  for (const x of [1.4, 3.3, 7.4, 9.5]) box(office, 'Cabinet divider', x, 4, 56.6, .14, 8, 1.25, navy);
  for (const x of [2.35, 8.45]) for (const y of [1.4, 3, 4.6, 6.2, 7.9]) box(office, 'Navy open shelf', x, y, 56.6, 1.9, .12, 1.25, navy);
  box(office, 'Navy cabinet doors', 5.35, 3.2, 56, 4, 6.4, .14, navy);
  for (const x of [5.2, 5.5]) box(office, 'Brass cabinet handle', x, 3.5, 55.9, .05, 1.4, .07, brass);
  for (let i = 0; i < 5; i++) box(office, 'Books', 8.4, 1.5 + i * .13, 56.4, 1.15, .1, .8, surface(i % 2 ? '#c2b7a1' : '#6a6d69'));
  const desk = group('Walnut desk with monitor', 8.5, 54, -Math.PI / 2);
  box(desk, 'Rounded walnut desk surface', 0, 2.5, 0, 5.4, .22, 2.7, walnut, .11);
  for (const s of [-1, 1]) box(desk, 'Desk leg', s * 2.2, 1.25, 0, .3, 2.5, 2.2, walnut);
  box(desk, 'Monitor riser', 0, 2.82, -.5, 2.2, .45, .7, woodEdge, .09);
  box(desk, 'Blank monitor', 0, 3.95, -.65, 2.5, 1.5, .12, screen, .04);
  box(desk, 'Keyboard', 0, 2.67, .35, 1.4, .06, .5, linen);
  const chair = group('Cream padded office chair', 6, 54, Math.PI / 2);
  cylinder(chair, 0, .7, 0, .09, 1.3, metal);
  for (let i = 0; i < 5; i++) {
    const leg = box(chair, 'Swivel base', 0, .2, 0, .1, .13, 2.3, metal);
    leg.rotation.y = i * Math.PI / 5;
  }
  box(chair, 'Padded seat', 0, 1.6, 0, 2, .4, 1.9, linen, .18);
  box(chair, 'Tall padded back', 0, 2.65, -.8, 2, 2, .45, linen, .2);
  box(chair, 'Head cushion', 0, 3.4, -.5, 1.5, .7, .35, cushion, .17);
  for (const s of [-1, 1]) box(chair, 'Padded arm', s * 1, 2, .1, .3, .3, 1.7, linen, .1);

  const coffee = group('Kitchen espresso machine', 19.4, 9.8, -Math.PI / 2);
  box(coffee, 'Black espresso machine', 0, 3.9, 0, 1.3, 1.55, 1.2, leather, .08);
  box(coffee, 'Coffee dispenser', 0, 3.9, .65, .48, .35, .15, metal);
  box(coffee, 'Drip tray', 0, 3.25, .2, 1.2, .06, 1.2, metal);
  cylinder(coffee, 0, 3.46, .55, .14, .32, brass);
  const nook = group('Round pale kitchen table — cooking-video reference', 7.4, 10.8);
  cylinder(nook, 0, 2.5, 0, 1.85, .17, linen);
  cylinder(nook, 0, 1.25, 0, .18, 2.5, woodEdge);
  cylinder(nook, 0, .15, 0, 1, .2, woodEdge);
  for(const [x,z,rotation] of [[7.4,8.1,0],[10,10.8,-Math.PI/2]]) {
    const seat=group('Kitchen nook chair', x,z,rotation);
    box(seat,'Cream chair seat',0,1.55,0,1.65,.22,1.65,linen,.08);
    box(seat,'Curved pale chair back',0,2.2,-.68,1.7,1.15,.18,linen,.08);
    for(const x of [-.6,.6])for(const z of [-.6,.6])box(seat,'Timber leg',x,.75,z,.15,1.5,.15,woodEdge);
  }
  const nookBench=group('Kitchen L-shaped fluted banquette',0,0);
  const gray=surface('#93958b');
  box(nookBench,'West bench base',4.95, .7,11.4,1.55,1.4,5.4,woodEdge);
  box(nookBench,'Back bench base',7.15,.7,13.75,5.9,1.4,1.4,woodEdge);
  box(nookBench,'West gray cushion',4.95,1.5,11.4,1.6,.25,5.4,gray,.1);
  box(nookBench,'Back gray cushion',7.15,1.5,13.75,5.9,.25,1.45,gray,.1);
  for(let z=8.8;z<14;z+=.14)box(nookBench,'Vertical wood fluting',5.75,.7,z,.045,1.4,.07,walnut);
  for(let x=4.3;x<10;x+=.14)box(nookBench,'Vertical wood fluting',x,.7,13.02,.07,1.4,.045,walnut);
  for(const x of [6,8.7])box(nookBench,'Nook pillow',x,2.15,14,1.3,1.15,.35,cushion,.17);

  const laundry=group('Kitchen stacked laundry cupboard',19,15.35,-Math.PI/2);
  for(const x of [-1.5,1.5])box(laundry,'White cupboard side',x,3.7,0,.15,7.4,2.8,linen);
  box(laundry,'White cupboard top',0,7.45,0,3.15,.15,2.8,linen);
  for(const y of [1.65,4.95]) {
    box(laundry,'Silver front-loading appliance',0,y,0,2.65,3.15,2.65,surface('#bbbeb8'),.05);
    const rim=cylinder(laundry,0,y-.2,1.35,.95,.1,metal);rim.rotation.x=Math.PI/2;
    const door=cylinder(laundry,0,y-.2,1.42,.75,.08,screen);door.rotation.x=Math.PI/2;
    box(laundry,'Appliance control strip',0,y+1.1,1.35,2.5,.4,.06,linen);
  }

  const primary=group('Primary bedroom — video-confirmed room',4.7,26.4,Math.PI/2);
  box(primary,'Blue-gray bedroom rug',0,.04,.25,8.5,.06,10,surface('#66707c'));
  for(const width of [8.2,7.8]) {
    for(const s of [-1,1])box(primary,'Rug border',s*width/2,.08,.25,.05,.01,9.7,linen);
  }
  box(primary,'Dark upholstered bed base',0,.65,0,5.9,1.1,6.8,leather,.1);
  box(primary,'White bedroom duvet',0,1.35,.1,6.1,.65,6.65,cushion,.2);
  box(primary,'Dark low headboard',0,2,-3.45,6.2,3.1,.3,gray,.1);
  for(const s of [-1,1]) {
    box(primary,'White sleeping pillow',s*1.5,1.8,-2.2,2.6,.4,1.55,linen,.18);
    box(primary,'Bedside table',s*3.65,1.65,-2.7,1.1,.15,1.3,walnut);
    for(const a of [-.45,.45])box(primary,'Bedside metal leg',s*3.65+a,.8,-2.7,.05,1.6,1.1,metal);
    cylinder(primary,s*3.65,3.2,-3.3,.13,.7,brass);
  }
  // Opposite the bed, not in either of the unconfirmed lower bedrooms.
  const dressers=group('Pair of dark dressers and blue prints',10.45,27,-Math.PI/2);
  for(const x of [-2.05,2.05]) {
    box(dressers,'Black three-drawer dresser',x,1.55,0,3.85,2.9,1.6,leather,.04);
    for(const y of [.7,1.5,2.3]) {
      box(dressers,'Drawer face',x,y,.83,3.7,.7,.06,leather);
      for(const dx of [-.9,.9])box(dressers,'Brass drawer pull',x+dx,y,.9,.55,.06,.08,brass);
    }
    box(dressers,'Pale print frame',x,5.3,-.68,3.25,3.4,.08,linen);
    box(dressers,'Blue botanical print approximation',x,5.3,-.61,3.06,3.2,.035,surface('#4c9fae'));
    for(let i=0;i<12;i++)box(dressers,'Small pale blossom',x+Math.sin(i*2.4)*1.3,4+((i*7)%12)*.22,-.58,.15,.1,.02,cushion,.03);
  }
  const spare=group('Spare room — drying and storage, no inferred bed',20,27);
  box(spare,'Pink and purple spare-room rug',0,.04,0,6.5,.06,8,surface('#965084'));
  for(let x=-3;x<3;x+=.5)box(spare,'Teal rug stripe',x,.08,0,.08,.01,7.5,surface('#4b939a'));
  for(const x of [-1.4,1.4])box(spare,'Drying rack frame',x,1.8,0,.06,3.6,3.5,metal);
  for(let z=-1.65;z<=1.7;z+=.4)box(spare,'Drying rail',0,3.5,z,2.8,.05,.05,metal);
  for(const [x,z,color] of [[-.7,-1,'#315166'],[.65,0,'#e2d9bd'],[-.4,1,'#667163']] as const)
    box(spare,'Hanging fabric',x,2.65,z,1.1,1.7,.07,surface(color));
  const shelves=group('Tall walnut spare-room shelves',21,33.85);
  for(const x of [-1.85,1.85])box(shelves,'Bookcase side',x,3.8,0,.16,7.6,1.3,walnut);
  for(let y=.3;y<7.7;y+=1.45)box(shelves,'Walnut shelf',0,y,0,3.8,.12,1.3,walnut);
  for(const x of [-.9,.9])for(const y of [1,3.9,5.4])box(shelves,'Neutral storage basket',x,y,0,1.45,.9,1.05,linen,.07);

  const tile=surface('#444c4c'),bathWood=surface('#714a35'),bathGray=surface('#777e80');
  const showerGlass=new T.MeshStandardMaterial({color:'#b6cccc',transparent:true,opacity:.25,roughness:.12});
  function toilet(g:T.Group,x:number,z:number) {
    cylinder(g,x,.8,z,.58,1.5,linen);
    box(g,'White toilet tank',x,1.9,z-.5,1.3,1.6,.6,linen,.12);
    cylinder(g,x,1.55,z+.18,.65,.15,cushion);
  }
  const woodBath=group('Wood-paneled bathroom — walkthrough finishes',0,0);
  box(woodBath,'Dark bathroom tile',7.75,.035,36.6,7.1,.06,5.8,tile);
  // The exterior bathroom window must cut the wood lining as well as the plaster.
  for(let y=.28;y<8.4;y+=.48) {
    box(woodBath,'Horizontal wood wall board',7.75,y,33.72,7.1,.45,.07,bathWood);
    if(y+.225>3.2&&y-.225<7.8){
      box(woodBath,'Horizontal wood wall board',4.22,y,33.975,.07,.45,.55,bathWood);
      box(woodBath,'Horizontal wood wall board',4.22,y,38.025,.07,.45,2.95,bathWood);
    }else box(woodBath,'Horizontal wood wall board',4.22,y,36.6,.07,.45,5.8,bathWood);
  }
  box(woodBath,'Gray floating two-drawer vanity',9.4,1.8,34.75,2.8,2.1,1.8,bathGray,.03);
  box(woodBath,'Integrated white sink',9.4,2.94,34.75,2.9,.2,1.9,linen,.03);
  box(woodBath,'Basin inset',9.4,3.05,34.75,1.8,.03,1.2,gray,.1);
  box(woodBath,'Frameless vanity mirror',9.4,5.1,33.85,2.8,3.1,.04,mirror);
  toilet(woodBath,5.5,35.1);
  const mainShower=group('Main bathroom recessed shower',0,0,0,woodBath);
  box(mainShower,'Main shower dark tile base',6.6,.12,41.45,4.8,.2,3.05,tile);
  box(mainShower,'Main shower tiled back wall',6.6,3.8,42.87,4.8,7.6,.08,tile);
  box(mainShower,'Main shower tiled side wall',4.23,3.8,41.45,.08,7.6,3.05,tile);
  // Fine horizontal tile joints make this visibly a shower, not a nearly invisible pane.
  for(let y=.25;y<7.6;y+=.25)box(mainShower,'Shower tile joint',6.6,y,42.82,4.8,.015,.01,bathGray);
  box(mainShower,'Main shower curb',6.6,.22,39.88,4.8,.4,.28,tile);
  box(mainShower,'Main shower fixed glass panel',5.15,3.9,39.87,1.7,7.25,.06,showerGlass);
  box(mainShower,'Main shower glass door',7.43,3.9,39.87,2.8,7.25,.06,showerGlass);
  for(const x of [4.27,6.03,8.89])box(mainShower,'Main shower glass edge',x,3.9,39.87,.035,7.25,.075,metal);
  box(mainShower,'Main shower chrome handle',6.28,3.65,39.73,.08,1.15,.12,metal);
  cylinder(mainShower,6.6,5.5,42.62,.04,3.5,metal);
  box(mainShower,'Main shower overhead arm',6.6,7.23,42.2,.08,.08,.85,metal);
  cylinder(mainShower,6.6,7.18,41.8,.38,.08,metal);
  box(mainShower,'Main shower mixer',6.6,3.7,42.68,.4,.55,.1,metal,.04);
  box(mainShower,'Main shower drain',6.6,.235,41.7,.4,.02,.4,metal);
  const officeBath=group('Office bathroom — white and natural wood',0,0);
  box(officeBath,'Office dark floor tile',4,.035,43,7.6,.06,5.6,tile);
  box(officeBath,'Wood floating vanity',1.1,1.65,43,1.7,2,3.3,woodEdge);
  box(officeBath,'White vessel sink',1.1,2.95,43,1.65,.6,1.7,linen,.06);
  box(officeBath,'Vessel basin inset',1.1,3.26,43,1.3,.025,1.35,gray,.05);
  box(officeBath,'Upper wood cupboard',.55,6,43.55,.7,3,1.1,woodEdge);
  box(officeBath,'Office bathroom mirror',.3,5,44.9,.04,3,1.5,mirror);
  toilet(officeBath,2.7,40.9);
  box(officeBath,'Office shower tray',6.15,.12,44.65,3,.2,2.65,linen);
  box(officeBath,'Office glass shower enclosure',4.65,3.5,44.65,.06,6.8,2.65,showerGlass);
  box(officeBath,'Chrome shower door handle',4.57,3.5,44.2,.08,1.2,.09,metal);
  const patio = group('Garden bistro set — approximate photo placement', 12, -11);
  const blue=surface('#278fc1',.45),yellow=surface('#bcac26');
  cylinder(patio,0,2.35,0,1.15,.09,blue);
  for(const s of [-1,1])box(patio,'Folding table leg',s*.65,1.15,0,.08,2.3,1.45,blue).rotation.z=s*.25;
  for(const s of [-1,1]) {
    box(patio,'Blue bistro seat',s*2.3,1.5,0,1.25,.1,1.3,blue);
    box(patio,'Blue bistro back',s*2.3,2.3,-.65,1.25,.65,.08,blue);
    for(const z of [-.5,.5])box(patio,'Bistro chair legs',s*2.3,.75,z,1.1,1.5,.07,blue);
    cylinder(patio,s*4.4,1,4.6,.72,2,yellow);
  }
  sofa(20,-12,5.8,-Math.PI/2);
  return layer;
}
