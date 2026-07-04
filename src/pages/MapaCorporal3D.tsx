import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'

// ── Maniquí neutro estilizado, construido por código (sin modelos externos) ──
// Figura tipo "dummy" de artista, en tono de marca, para el mapa corporal del paciente.

const COLOR = '#9fb4cf'      // maniquí (azul acero suave, de marca)
const COLOR_JUNTA = '#8aa3c4' // juntas un pelín más oscuras

// Un hueso: cápsula entre dos puntos del esqueleto.
function Bone({ a, b, r }: { a: [number, number, number]; b: [number, number, number]; r: number }) {
  const { pos, quat, len } = useMemo(() => {
    const va = new THREE.Vector3(...a)
    const vb = new THREE.Vector3(...b)
    const dir = new THREE.Vector3().subVectors(vb, va)
    const length = dir.length()
    const mid = new THREE.Vector3().addVectors(va, vb).multiplyScalar(0.5)
    const quat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize(),
    )
    return { pos: mid, quat, len: Math.max(0.001, length - r * 1.2) }
  }, [a, b, r])
  return (
    <mesh position={pos} quaternion={quat} castShadow>
      <capsuleGeometry args={[r, len, 10, 20]} />
      <meshStandardMaterial color={COLOR} roughness={0.62} metalness={0.06} />
    </mesh>
  )
}

function Junta({ p, r }: { p: [number, number, number]; r: number }) {
  return (
    <mesh position={p} castShadow>
      <sphereGeometry args={[r, 24, 24]} />
      <meshStandardMaterial color={COLOR_JUNTA} roughness={0.6} metalness={0.06} />
    </mesh>
  )
}

function Maniqui() {
  // Puntos del esqueleto (y+ arriba, centrado en el ombligo ≈ y 0).
  const cabeza: [number, number, number] = [0, 0.78, 0]
  const cuelloArr: [number, number, number] = [0, 0.6, 0]
  const cuelloAb: [number, number, number] = [0, 0.5, 0]
  const homL: [number, number, number] = [0.2, 0.48, 0]
  const homR: [number, number, number] = [-0.2, 0.48, 0]
  const codoL: [number, number, number] = [0.3, 0.2, 0.02]
  const codoR: [number, number, number] = [-0.3, 0.2, 0.02]
  const munL: [number, number, number] = [0.34, -0.08, 0.04]
  const munR: [number, number, number] = [-0.34, -0.08, 0.04]
  const pecho: [number, number, number] = [0, 0.4, 0]
  const cintura: [number, number, number] = [0, 0.12, 0]
  const pelvis: [number, number, number] = [0, -0.02, 0]
  const cadL: [number, number, number] = [0.11, -0.06, 0]
  const cadR: [number, number, number] = [-0.11, -0.06, 0]
  const rodL: [number, number, number] = [0.12, -0.5, 0.01]
  const rodR: [number, number, number] = [-0.12, -0.5, 0.01]
  const tobL: [number, number, number] = [0.12, -0.9, 0]
  const tobR: [number, number, number] = [-0.12, -0.9, 0]

  return (
    <group>
      {/* Cabeza y cuello */}
      <mesh position={cabeza} castShadow>
        <sphereGeometry args={[0.135, 32, 32]} />
        <meshStandardMaterial color={COLOR} roughness={0.6} metalness={0.06} />
      </mesh>
      <Bone a={cuelloArr} b={cuelloAb} r={0.055} />

      {/* Tronco: pecho (más ancho) + abdomen + pelvis */}
      <mesh position={pecho} castShadow>
        <sphereGeometry args={[0.2, 32, 32]} />
        <meshStandardMaterial color={COLOR} roughness={0.62} metalness={0.06} />
      </mesh>
      <Bone a={pecho} b={cintura} r={0.155} />
      <mesh position={pelvis} castShadow>
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshStandardMaterial color={COLOR} roughness={0.62} metalness={0.06} />
      </mesh>

      {/* Hombros */}
      <Junta p={homL} r={0.075} />
      <Junta p={homR} r={0.075} />

      {/* Brazos */}
      <Bone a={homL} b={codoL} r={0.052} />
      <Bone a={homR} b={codoR} r={0.052} />
      <Junta p={codoL} r={0.05} />
      <Junta p={codoR} r={0.05} />
      <Bone a={codoL} b={munL} r={0.045} />
      <Bone a={codoR} b={munR} r={0.045} />
      {/* Manos */}
      <mesh position={munL} castShadow><sphereGeometry args={[0.058, 20, 20]} /><meshStandardMaterial color={COLOR} roughness={0.6} metalness={0.06} /></mesh>
      <mesh position={munR} castShadow><sphereGeometry args={[0.058, 20, 20]} /><meshStandardMaterial color={COLOR} roughness={0.6} metalness={0.06} /></mesh>

      {/* Caderas */}
      <Junta p={cadL} r={0.078} />
      <Junta p={cadR} r={0.078} />

      {/* Piernas */}
      <Bone a={cadL} b={rodL} r={0.066} />
      <Bone a={cadR} b={rodR} r={0.066} />
      <Junta p={rodL} r={0.06} />
      <Junta p={rodR} r={0.06} />
      <Bone a={rodL} b={tobL} r={0.052} />
      <Bone a={rodR} b={tobR} r={0.052} />
      {/* Pies */}
      <mesh position={[0.12, -0.94, 0.05]} castShadow><boxGeometry args={[0.1, 0.06, 0.22]} /><meshStandardMaterial color={COLOR} roughness={0.6} metalness={0.06} /></mesh>
      <mesh position={[-0.12, -0.94, 0.05]} castShadow><boxGeometry args={[0.1, 0.06, 0.22]} /><meshStandardMaterial color={COLOR} roughness={0.6} metalness={0.06} /></mesh>
    </group>
  )
}

export default function MapaCorporal3D() {
  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-brand-100"
      style={{
        height: 'min(70vh, 520px)',
        background: 'radial-gradient(120% 90% at 50% 15%, #f4f8fc 0%, #e6eef7 55%, #d5e2f0 100%)',
      }}
    >
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0.05, 3.2], fov: 40 }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.65} />
        <directionalLight position={[3, 5, 4]} intensity={1.15} castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-4, 2, -3]} intensity={0.35} />
        <pointLight position={[0, -1, 3]} intensity={0.25} />
        <Maniqui />
        <ContactShadows position={[0, -0.96, 0]} opacity={0.38} blur={2.6} scale={3} far={2} color="#456f9c" />
        <OrbitControls
          enablePan={false}
          enableDamping
          autoRotate
          autoRotateSpeed={0.7}
          minDistance={2.2}
          maxDistance={4.6}
          target={[0, -0.05, 0]}
        />
      </Canvas>
      <p className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 text-[11px] text-brand-500/70">
        Arrastra para girar · pellizca para acercar
      </p>
    </div>
  )
}
