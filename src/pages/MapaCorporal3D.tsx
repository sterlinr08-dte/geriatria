import { Suspense, useLayoutEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, ContactShadows, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

// ── Cuerpo humano real (modelo 3D) para el mapa corporal del paciente ──
// Modelo GLB neutro (Mixamo "X Bot", uso libre), recoloreado a un acabado clínico
// gris de marca. Se le bajan los brazos (pose de pie) y se centra/escala por código.

const MODELO = '/xbot.glb'
useGLTF.preload(MODELO)

const COLOR_CUERPO = '#b9c6da' // gris azulado de marca, acabado mate clínico

function Cuerpo() {
  const { scene } = useGLTF(MODELO)
  useLayoutEffect(() => {
    scene.traverse((o: any) => {
      // Pose: brazos abajo al costado (el modelo viene en pose de T)
      if (o.isBone) {
        const n = o.name.toLowerCase()
        if (n.includes('leftarm') && !n.includes('fore')) o.rotation.z = -1.4
        if (n.includes('rightarm') && !n.includes('fore')) o.rotation.z = 1.4
        if (n.includes('leftforearm')) o.rotation.z = -0.12
        if (n.includes('rightforearm')) o.rotation.z = 0.12
      }
      // Acabado clínico neutro
      if (o.isMesh) {
        o.material = new THREE.MeshStandardMaterial({ color: COLOR_CUERPO, roughness: 0.6, metalness: 0.05 })
        o.castShadow = true
      }
    })
    // Centrar y escalar a ~1.7 de alto (idempotente: se resetea antes de medir)
    scene.scale.set(1, 1, 1)
    scene.position.set(0, 0, 0)
    scene.updateWorldMatrix(true, true)
    const box = new THREE.Box3().setFromObject(scene)
    const size = new THREE.Vector3(); box.getSize(size)
    const center = new THREE.Vector3(); box.getCenter(center)
    const k = 1.7 / (size.y || 1)
    scene.scale.setScalar(k)
    scene.position.set(-center.x * k, -center.y * k, -center.z * k)
  }, [scene])
  return <primitive object={scene} />
}

export default function MapaCorporal3D() {
  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-brand-100"
      style={{
        height: 'min(72vh, 560px)',
        background: 'radial-gradient(120% 90% at 50% 12%, #f4f8fc 0%, #e6eef7 55%, #d5e2f0 100%)',
      }}
    >
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0.1, 3.0], fov: 40 }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[3, 6, 4]} intensity={1.15} castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-4, 2, -3]} intensity={0.4} />
        <Suspense fallback={null}>
          <Cuerpo />
        </Suspense>
        <ContactShadows position={[0, -0.9, 0]} opacity={0.32} blur={2.6} scale={3} far={2.2} color="#456f9c" />
        <OrbitControls
          enablePan={false}
          enableDamping
          autoRotate
          autoRotateSpeed={0.7}
          minDistance={2}
          maxDistance={4.5}
          target={[0, 0, 0]}
        />
      </Canvas>
      <p className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 text-[11px] text-brand-500/70">
        Arrastra para girar · pellizca para acercar
      </p>
    </div>
  )
}
