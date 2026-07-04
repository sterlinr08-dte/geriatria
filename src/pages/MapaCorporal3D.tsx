import { Suspense, useLayoutEffect, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, ContactShadows, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { ZONAS, nivelDef, NivelKey } from '../lib/mapaCorporal'

// ── Cuerpo humano real (GLB) con "heatmap" de zonas para la Evaluación Geriátrica ──
// Modelo neutro (Mixamo "X Bot", uso libre) recoloreado a gris de marca; brazos abajo;
// cada zona con nivel de alerta se ENCIENDE del color del nivel. Zonas tocables.

const MODELO = '/xbot.glb'
useGLTF.preload(MODELO)

const COLOR_CUERPO = '#b9c6da'
const ESCALA_GLOW: Record<NivelKey, number> = { sin: 0, leve: 0.32, moderado: 0.4, severo: 0.5 }

function texturaGlow() {
  const c = document.createElement('canvas'); c.width = c.height = 128
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.35, 'rgba(255,255,255,0.5)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(c)
}

function Cuerpo({ niveles, onSelect }: { niveles: Record<string, NivelKey>; onSelect: (k: string) => void }) {
  const { scene } = useGLTF(MODELO)
  const tex = useMemo(texturaGlow, [])
  useLayoutEffect(() => {
    scene.traverse((o: any) => {
      if (o.isBone) {
        const n = o.name.toLowerCase()
        if (n.includes('leftarm') && !n.includes('fore')) o.rotation.z = -1.4
        if (n.includes('rightarm') && !n.includes('fore')) o.rotation.z = 1.4
        if (n.includes('leftforearm')) o.rotation.z = -0.12
        if (n.includes('rightforearm')) o.rotation.z = 0.12
      }
      if (o.isMesh) o.material = new THREE.MeshStandardMaterial({ color: COLOR_CUERPO, roughness: 0.6, metalness: 0.05 })
    })
    scene.scale.set(1, 1, 1); scene.position.set(0, 0, 0); scene.updateWorldMatrix(true, true)
    const box = new THREE.Box3().setFromObject(scene)
    const size = new THREE.Vector3(); box.getSize(size)
    const center = new THREE.Vector3(); box.getCenter(center)
    const k = 1.7 / (size.y || 1)
    scene.scale.setScalar(k); scene.position.set(-center.x * k, -center.y * k, -center.z * k)
  }, [scene])

  return (
    <group>
      <primitive object={scene} />
      {ZONAS.map((z) => {
        const nk = niveles[z.key] ?? 'sin'
        const nd = nivelDef(nk)
        return (
          <group key={z.key} position={z.anchor}>
            {/* Glow del nivel (heatmap) */}
            {nd.glow && (
              <sprite scale={[ESCALA_GLOW[nk], ESCALA_GLOW[nk], ESCALA_GLOW[nk]]}>
                <spriteMaterial map={tex} color={nd.color} blending={THREE.AdditiveBlending} transparent depthWrite={false} opacity={0.9} />
              </sprite>
            )}
            {/* Punto de identidad de la zona */}
            <mesh>
              <sphereGeometry args={[0.02, 16, 16]} />
              <meshStandardMaterial color={nd.glow ? nd.color : z.color} emissive={nd.glow ? nd.color : '#000000'} emissiveIntensity={nd.glow ? 0.5 : 0} />
            </mesh>
            {/* Zona tocable (invisible, más grande) */}
            <mesh
              onPointerDown={(e) => { e.stopPropagation(); onSelect(z.key) }}
              onPointerOver={() => (document.body.style.cursor = 'pointer')}
              onPointerOut={() => (document.body.style.cursor = 'auto')}
            >
              <sphereGeometry args={[0.1, 16, 16]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

export default function MapaCorporal3D({
  niveles = {},
  onSelect = () => {},
}: {
  niveles?: Record<string, NivelKey>
  onSelect?: (k: string) => void
}) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-brand-100"
      style={{
        height: 'min(70vh, 540px)',
        background: 'radial-gradient(120% 90% at 50% 12%, #f4f8fc 0%, #e6eef7 55%, #d5e2f0 100%)',
      }}
    >
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0.1, 3.0], fov: 40 }} gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[3, 6, 4]} intensity={1.15} />
        <directionalLight position={[-4, 2, -3]} intensity={0.4} />
        <Suspense fallback={null}>
          <Cuerpo niveles={niveles} onSelect={onSelect} />
        </Suspense>
        <ContactShadows position={[0, -0.9, 0]} opacity={0.32} blur={2.6} scale={3} far={2.2} color="#456f9c" />
        <OrbitControls enablePan={false} enableDamping autoRotate autoRotateSpeed={0.6} minDistance={2} maxDistance={4.5} target={[0, 0, 0]} />
      </Canvas>
      <p className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 text-[11px] text-brand-500/70">
        Toca una zona · arrastra para girar · pellizca para acercar
      </p>
    </div>
  )
}
