import { Suspense, useEffect, useMemo, useState } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

// Drop files into /public/models: chair.glb, plant.glb. Missing file => the procedural version is used.
const found = {}
function useHasModel(name) {
  const [ok, setOk] = useState(found[name])
  useEffect(() => {
    if (found[name] !== undefined) return
    fetch(`/models/${name}.glb`, { method: 'HEAD' })
      .then((r) => { found[name] = r.ok && !(r.headers.get('content-type') || '').includes('text/html'); setOk(found[name]) })
      .catch(() => { found[name] = false; setOk(false) })
  }, [name])
  return ok
}
export const withModel = (name, GLB, Proc) => (props) => {
  const ok = useHasModel(name)
  return ok ? <Suspense fallback={<Proc {...props} />}><GLB {...props} /></Suspense> : <Proc {...props} />
}

// instanced chairs: every mesh of the GLB is normalised to ~0.92 m tall, base on the floor, and instanced per chair
export function GLBChairs({ items }) {
  const { scene } = useGLTF('/models/chair.glb')
  const meshes = useMemo(() => {
    scene.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(scene), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3()), k = 0.92 / size.y
    const norm = new THREE.Matrix4().makeScale(k, k, k).multiply(new THREE.Matrix4().makeTranslation(-c.x, -box.min.y, -c.z))
    const out = [], o = new THREE.Object3D(), m = new THREE.Matrix4()
    scene.traverse((n) => {
      if (!n.isMesh) return
      const base = norm.clone().multiply(n.matrixWorld), inst = new THREE.InstancedMesh(n.geometry, n.material, items.length)
      items.forEach((it, i) => { o.position.set(it.p[0], 0, it.p[1]); o.rotation.set(0, it.ry, 0); o.scale.setScalar(it.s || 1); o.updateMatrix(); inst.setMatrixAt(i, m.multiplyMatrices(o.matrix, base)) })
      inst.frustumCulled = false; out.push(inst)
    })
    return out
  }, [scene, items])
  return <>{meshes.map((m, i) => <primitive key={i} object={m} />)}</>
}

// a potted plant / tree GLB scaled to `height`, standing on the floor at `position`
export function GLBTree({ position, height = 3.6, scale = 1 }) {
  const { scene } = useGLTF('/models/plant.glb')
  const obj = useMemo(() => {
    const c = scene.clone(true), box = new THREE.Box3().setFromObject(c), size = box.getSize(new THREE.Vector3()), g = new THREE.Group()
    c.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2); g.add(c); g.scale.setScalar(height / size.y)
    return g
  }, [scene, height])
  return <group position={position} scale={scale}><primitive object={obj} /></group>
}
