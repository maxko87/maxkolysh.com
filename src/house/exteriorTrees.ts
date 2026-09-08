import * as T from 'three';
const F=.3048;
/** Foliage for the window outlooks, not a survey of neighboring landscaping. */
export const treePositions = [
  {x:1.1,z:10,r:1.8},{x:1.1,z:36,r:1.8},
  {x:-6,z:43,r:3.8},{x:31,z:23,r:3.8},{x:28,z:6,r:3.6},
  {x:12,z:-10,r:4},{x:21,z:-13,r:4.5},
  {x:3,z:69,r:4.8},{x:15,z:72,r:5.5},{x:26,z:70,r:5.3},
];
export function addExteriorTrees(parent:T.Group) {
  const group=new T.Group();group.name='Exterior trees — illustrative window outlooks';parent.add(group);
  const bark=new T.MeshStandardMaterial({color:'#695440',roughness:1});
  const leafGeometry=new T.IcosahedronGeometry(1,1);
  const foliage=['#587b45','#749551','#456a3e'].map(color=>new T.MeshStandardMaterial({color,roughness:.95}));
  const dummy=new T.Object3D();
  treePositions.forEach(({x,z,r},index)=>{
    const tree=new T.Group();tree.position.set(x*F,0,z*F);tree.name=`Window-outlook tree ${index+1}`;group.add(tree);
    const trunk=new T.Mesh(new T.CylinderGeometry(.13*F,.25*F,12*F,7),bark);
    trunk.position.y=0;trunk.castShadow=true;tree.add(trunk);
    for(let b=0;b<5;b++){
      const branch=new T.Mesh(new T.CylinderGeometry(.045*F,.1*F,4*F,6),bark);
      branch.position.set(Math.sin(b*2)*F,3.3*F,Math.cos(b*2)*F);
      branch.rotation.set(Math.sin(b*2)*.65,0,Math.cos(b*2)*.65);tree.add(branch);
    }
    foliage.forEach((material,color)=>{
      const leaves=new T.InstancedMesh(leafGeometry,material,20);
      leaves.name='Leaf clusters';leaves.castShadow=true;leaves.receiveShadow=true;
      for(let i=0;i<20;i++){
        const n=i*3+color,a=n*2.39996+index,radius=r*Math.sqrt((n+.5)/60);
        dummy.position.set(Math.cos(a)*radius*F,(5.7+Math.sin(n*1.7)*1.9+(1-radius/r)*2)*F,Math.sin(a)*radius*F);
        dummy.scale.set(r*.36*F,r*.42*F,r*.32*F);dummy.rotation.set(n*.13,n*.4,n*.2);dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix);
      }
      tree.add(leaves);
    });
  });
  return group;
}
