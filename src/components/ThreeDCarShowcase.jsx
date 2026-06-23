import { useRef, useState, useEffect, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Check if WebGL is supported in the browser
function isWebGLAvailable() {
  try {
    const canvas = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')))
  } catch (e) {
    return false
  }
}

// Infinite moving grid floor (Synthwave JDM retro road)
function InfiniteRoadGrid({ scrollProgress }) {
  const gridRef = useRef()

  useFrame((state, delta) => {
    if (!gridRef.current) return
    // Speed scales up as you scroll
    const speed = 3.0 + scrollProgress * 12.0
    gridRef.current.position.z += delta * speed
    
    // Grid size is 120, division is 60. Spacing per grid line is 120/60 = 2 units.
    // Reset position.z seamlessly when it scrolls past 2 units.
    if (gridRef.current.position.z > 2.0) {
      gridRef.current.position.z = 0
    }
  })

  return (
    <group ref={gridRef}>
      <gridHelper
        args={[120, 60, '#E10600', '#181818']}
        position={[0, -0.65, 0]}
      />
    </group>
  )
}

// Procedural 3D Sports Car Mesh
function ProceduralCar({ scrollProgress, isMobile }) {
  const carRef = useRef()
  const flWheel = useRef()
  const frWheel = useRef()
  const rlWheel = useRef()
  const rrWheel = useRef()
  const headlightL = useRef()
  const headlightR = useRef()
  const flWheelGroup = useRef()
  const frWheelGroup = useRef()

  useFrame((state, delta) => {
    if (!carRef.current) return

    // 1. Spin the wheels based on current scroll position/speed
    const spinSpeed = 8.0 + scrollProgress * 25.0
    if (flWheel.current) flWheel.current.rotation.x += delta * spinSpeed
    if (frWheel.current) frWheel.current.rotation.x += delta * spinSpeed
    if (rlWheel.current) rlWheel.current.rotation.x += delta * spinSpeed
    if (rrWheel.current) rrWheel.current.rotation.x += delta * spinSpeed

    // 2. Smoothly steer front wheels based on scroll-driven lateral motion
    let targetSteer = 0
    const p = scrollProgress
    if (!isMobile) {
      if (p > 0.05 && p < 0.16) {
        targetSteer = -0.22
      } else if (p >= 0.16 && p < 0.28) {
        targetSteer = 0.32
      } else if (p >= 0.28 && p < 0.33) {
        targetSteer = -0.08
      } else if (p >= 0.33 && p < 0.45) {
        targetSteer = -0.25
      } else if (p >= 0.50 && p < 0.60) {
        targetSteer = 0.18
      } else if (p >= 0.67 && p < 0.78) {
        targetSteer = -0.3
      } else if (p >= 0.83 && p < 0.95) {
        targetSteer = 0.12
      }
    } else {
      // Gentle snake-like steering weaving on mobile
      targetSteer = Math.sin(state.clock.getElapsedTime() * 1.8) * 0.1
    }

    if (flWheelGroup.current) {
      flWheelGroup.current.rotation.y = THREE.MathUtils.lerp(flWheelGroup.current.rotation.y, targetSteer, 0.1)
    }
    if (frWheelGroup.current) {
      frWheelGroup.current.rotation.y = THREE.MathUtils.lerp(frWheelGroup.current.rotation.y, targetSteer, 0.1)
    }

    // 2. Interpolate Car Position, Rotation & Scale based on scroll progress
    let targetX = 0
    let targetY = -0.15
    let targetZ = 0
    
    let targetRotX = 0
    let targetRotY = 0
    let targetRotZ = 0
    
    let targetScale = isMobile ? 0.7 : 1.15

    if (isMobile) {
      // Mobile choreography: Center in background so it doesn't block text
      targetX = 0
      targetY = -0.5
      targetZ = -1.2
      targetScale = 0.55
      
      // Infinite slow turn to show off the angles on mobile
      targetRotY = -0.3 + p * Math.PI * 3.5
      
      if (p > 0.85) {
        // Last section: drive away into distance
        const local = (p - 0.85) / 0.15
        targetZ = -1.2 - local * 25.0
        targetScale = 0.55 * (1.0 - local * 0.9)
      }
    } else {
      // Desktop choreography: Precise stage mapping corresponding to the sections
      if (p < 0.16) {
        // Section 1: Hero
        // Parked on right side of screen, facing forward-left diagonal
        const local = p / 0.16
        targetX = 1.6 - local * 0.4
        targetY = -0.15
        targetRotY = -0.6 + local * 1.2
      } else if (p < 0.33) {
        // Section 2: Why Garage Kings (Bento Grid)
        // Transitions to left side of screen, showing side profile details
        const local = (p - 0.16) / (0.33 - 0.16)
        targetX = 1.2 - local * 2.8
        targetY = -0.15
        targetRotY = 0.6 + local * 1.0
      } else if (p < 0.50) {
        // Section 3: PitStopLanes (Brands)
        // Centers and turns rear to show taillights, spoiler, and wheel stance
        const local = (p - 0.33) / (0.50 - 0.33)
        targetX = -1.6 + local * 1.6
        targetY = -0.15
        targetRotY = 1.6 + local * 1.54
      } else if (p < 0.67) {
        // Section 4: Vault (Showcase Shop)
        // Elevates onto a hydraulic display stand, tilting forward nose
        const local = (p - 0.50) / (0.67 - 0.50)
        targetX = local * 1.4
        targetY = -0.15 + local * 0.5
        targetRotY = 3.14 + local * 1.7
        targetRotX = local * 0.15
      } else if (p < 0.83) {
        // Section 5: Marketplace Preview
        // Drops back down, drifts sideways to the left
        const local = (p - 0.67) / (0.83 - 0.67)
        targetX = 1.4 - local * 2.8
        targetY = 0.35 - local * 0.5
        targetRotY = 4.84 + local * 0.9
        targetRotX = 0.15 - local * 0.15
      } else {
        // Section 6: Drop Ritual (Countdown & Footer)
        // Speeds away into the distance
        const local = (p - 0.83) / 0.17
        targetX = -1.4 + local * 1.4
        targetY = -0.15
        targetRotY = 5.74 + local * 0.54
        targetZ = -local * 35.0
        targetScale = 1.15 * (1.0 - local * 0.95)
      }
    }

    // Smoothly interpolate positions & rotations using lerp
    carRef.current.position.x += (targetX - carRef.current.position.x) * 0.08
    carRef.current.position.y += (targetY - carRef.current.position.y) * 0.08
    carRef.current.position.z += (targetZ - carRef.current.position.z) * 0.08

    carRef.current.rotation.x += (targetRotX - carRef.current.rotation.x) * 0.08
    carRef.current.rotation.y += (targetRotY - carRef.current.rotation.y) * 0.08
    carRef.current.rotation.z += (targetRotZ - carRef.current.rotation.z) * 0.08

    carRef.current.scale.setScalar(
      THREE.MathUtils.lerp(carRef.current.scale.x, targetScale, 0.08)
    )

    // Adjust headlight beam strength depending on scroll state
    const lightIntensity = (p < 0.1 || p > 0.8) ? 12 : 2
    if (headlightL.current) headlightL.current.intensity = THREE.MathUtils.lerp(headlightL.current.intensity, lightIntensity, 0.08)
    if (headlightR.current) headlightR.current.intensity = THREE.MathUtils.lerp(headlightR.current.intensity, lightIntensity, 0.08)
  })

  return (
    <group ref={carRef}>
      {/* 🏎️ Main Car Body Frame */}
      <mesh castShadow>
        <boxGeometry args={[1.8, 0.32, 4.1]} />
        <meshStandardMaterial 
          color="#E10600" 
          metalness={0.9} 
          roughness={0.15} 
          clearcoat={1.0}
          clearcoatRoughness={0.1}
        />
      </mesh>

      {/* Cabin Cockpit Glass */}
      <mesh position={[0, 0.45, -0.1]} castShadow>
        <boxGeometry args={[1.35, 0.58, 1.9]} />
        <meshStandardMaterial 
          color="#0d0d0f" 
          metalness={1.0} 
          roughness={0.05} 
          transparent 
          opacity={0.75} 
        />
      </mesh>

      {/* Sport Front Nose Bumper */}
      <mesh position={[0, -0.06, 2.15]} rotation={[0.08, 0, 0]} castShadow>
        <boxGeometry args={[1.78, 0.22, 0.75]} />
        <meshStandardMaterial color="#E10600" metalness={0.9} roughness={0.15} />
      </mesh>

      {/* Carbon Fiber Front Splitter Lip */}
      <mesh position={[0, -0.15, 2.4]}>
        <boxGeometry args={[1.82, 0.06, 0.35]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
      </mesh>

      {/* Hood Scoop / Vents */}
      <mesh position={[0, 0.18, 1.2]} rotation={[0.08, 0, 0]}>
        <boxGeometry args={[0.6, 0.04, 0.9]} />
        <meshStandardMaterial color="#111111" roughness={0.8} />
      </mesh>

      {/* Side Skirts */}
      <mesh position={[-0.92, -0.12, 0]} castShadow>
        <boxGeometry args={[0.06, 0.1, 2.3]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
      </mesh>
      <mesh position={[0.92, -0.12, 0]} castShadow>
        <boxGeometry args={[0.06, 0.1, 2.3]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
      </mesh>

      {/* Rear Spoiler Struts & Deck Wing */}
      <group position={[0, 0.52, -1.85]}>
        <mesh position={[-0.55, -0.25, 0]}>
          <boxGeometry args={[0.06, 0.48, 0.12]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        <mesh position={[0.55, -0.25, 0]}>
          <boxGeometry args={[0.06, 0.48, 0.12]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        <mesh position={[0, 0.02, 0]} castShadow>
          <boxGeometry args={[2.0, 0.04, 0.42]} />
          <meshStandardMaterial color="#E10600" metalness={0.9} roughness={0.15} />
        </mesh>
      </group>

      {/* Rear Diffuser Fins */}
      <group position={[0, -0.15, -2.0]}>
        <mesh position={[-0.2, 0, 0]}>
          <boxGeometry args={[0.04, 0.15, 0.4]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        <mesh position={[0.2, 0, 0]}>
          <boxGeometry args={[0.04, 0.15, 0.4]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
      </group>

      {/* Exhaust Pipes & Flame Glow */}
      <group position={[0, -0.15, -2.05]}>
        <mesh position={[-0.35, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.15, 8]} />
          <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0.35, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.15, 8]} />
          <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.3} />
        </mesh>
        <pointLight
          position={[0, 0, -0.25]}
          color="#FF3300"
          intensity={1.0 + scrollProgress * 5.0}
          distance={2.5}
        />
      </group>

      {/* Headlights & Light Rays */}
      <group position={[0, -0.02, 2.5]}>
        <mesh position={[-0.6, 0, 0.05]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshBasicMaterial color="#FFB300" />
        </mesh>
        <spotLight
          ref={headlightL}
          position={[-0.6, 0, 0.1]}
          angle={0.45}
          penumbra={0.6}
          color="#FFB300"
          distance={15}
        />

        <mesh position={[0.6, 0, 0.05]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshBasicMaterial color="#FFB300" />
        </mesh>
        <spotLight
          ref={headlightR}
          position={[0.6, 0, 0.1]}
          angle={0.45}
          penumbra={0.6}
          color="#FFB300"
          distance={15}
        />
      </group>

      {/* Tail LED Lights */}
      <group position={[0, 0.04, -2.07]}>
        <mesh position={[-0.65, 0, 0]}>
          <boxGeometry args={[0.32, 0.06, 0.04]} />
          <meshBasicMaterial color="#E10600" />
        </mesh>
        <mesh position={[0.65, 0, 0]}>
          <boxGeometry args={[0.32, 0.06, 0.04]} />
          <meshBasicMaterial color="#E10600" />
        </mesh>
      </group>

      {/* Chassis Neon Underglow */}
      <pointLight 
        position={[0, -0.5, 0]} 
        color={scrollProgress > 0.5 ? "#FFB300" : "#E10600"} 
        intensity={3.5 + Math.sin(scrollProgress * Math.PI) * 2} 
        distance={4.0} 
      />

      {/* 🛞 Rotating Wheels */}
      {/* Front Left Wheel */}
      <group ref={flWheelGroup} position={[-0.96, -0.2, 1.25]}>
        <mesh ref={flWheel} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.42, 0.42, 0.28, 24]} />
          <meshStandardMaterial color="#0c0c0e" roughness={0.85} />
          {/* Wheel Rim Center cap */}
          <mesh position={[0, 0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.02, 12]} />
            <meshStandardMaterial color="#FFB300" metalness={0.9} roughness={0.1} />
          </mesh>
        </mesh>
        {/* Brake Caliper */}
        <mesh position={[-0.04, 0.18, 0.08]} rotation={[0, 0, -Math.PI / 6]}>
          <boxGeometry args={[0.08, 0.2, 0.06]} />
          <meshStandardMaterial color="#E10600" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* Front Right Wheel */}
      <group ref={frWheelGroup} position={[0.96, -0.2, 1.25]}>
        <mesh ref={frWheel} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.42, 0.42, 0.28, 24]} />
          <meshStandardMaterial color="#0c0c0e" roughness={0.85} />
          <mesh position={[0, -0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.02, 12]} />
            <meshStandardMaterial color="#FFB300" metalness={0.9} roughness={0.1} />
          </mesh>
        </mesh>
        {/* Brake Caliper */}
        <mesh position={[0.04, 0.18, 0.08]} rotation={[0, 0, Math.PI / 6]}>
          <boxGeometry args={[0.08, 0.2, 0.06]} />
          <meshStandardMaterial color="#E10600" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* Rear Left Wheel */}
      <group position={[-0.96, -0.2, -1.25]}>
        <mesh ref={rlWheel} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.42, 0.42, 0.32, 24]} />
          <meshStandardMaterial color="#0c0c0e" roughness={0.85} />
          <mesh position={[0, 0.17, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.02, 12]} />
            <meshStandardMaterial color="#FFB300" metalness={0.9} roughness={0.1} />
          </mesh>
        </mesh>
        {/* Brake Caliper */}
        <mesh position={[-0.04, 0.18, 0.08]} rotation={[0, 0, -Math.PI / 6]}>
          <boxGeometry args={[0.08, 0.2, 0.06]} />
          <meshStandardMaterial color="#E10600" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* Rear Right Wheel */}
      <group position={[0.96, -0.2, -1.25]}>
        <mesh ref={rrWheel} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.42, 0.42, 0.32, 24]} />
          <meshStandardMaterial color="#0c0c0e" roughness={0.85} />
          <mesh position={[0, -0.17, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.02, 12]} />
            <meshStandardMaterial color="#FFB300" metalness={0.9} roughness={0.1} />
          </mesh>
        </mesh>
        {/* Brake Caliper */}
        <mesh position={[0.04, 0.18, 0.08]} rotation={[0, 0, Math.PI / 6]}>
          <boxGeometry args={[0.08, 0.2, 0.06]} />
          <meshStandardMaterial color="#E10600" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
    </group>
  )
}

export default function ThreeDCarShowcase() {
  const [scrollProgress, setScrollProgress] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [isWebGLSupported, setIsWebGLSupported] = useState(false)

  // Track WebGL compatibility
  useEffect(() => {
    setIsWebGLSupported(isWebGLAvailable())
  }, [])

  // Keep track of scroll and resize settings
  useEffect(() => {
    if (!isWebGLSupported) return

    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight
      const winHeight = window.innerHeight
      const totalScroll = docHeight - winHeight
      if (totalScroll > 0) {
        setScrollProgress(window.scrollY / totalScroll)
      }
    }

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize, { passive: true })
    
    // Initial calls
    handleScroll()
    handleResize()

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [isWebGLSupported])

  // Fallback to static ambient scene if WebGL isn't supported
  if (!isWebGLSupported) {
    return (
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
        <div className="gk-grid-floor absolute inset-0" />
        <div className="absolute -top-1/4 left-1/2 h-[60vh] w-[80vw] -translate-x-1/2 rounded-full bg-gk-yellow/[0.04] blur-[100px]" />
      </div>
    )
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-0 w-full h-full" style={{ mixBlendMode: 'screen' }} aria-hidden>
      <Canvas
        camera={{ position: [0, 1.2, 5.2], fov: 42 }}
        dpr={isMobile ? 1 : [1, 1.5]}
        shadows={false}
      >
        <color attach="background" args={['#050505']} />
        
        {/* Lights */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 12, 4]} intensity={0.8} />
        <directionalLight position={[-5, 8, -4]} intensity={0.4} />
        
        {/* Ambient colored lighting strips */}
        <pointLight position={[0, 4, 0]} color="#E10600" intensity={1.5} distance={10} />
        <pointLight position={[-6, 2, -3]} color="#FFB300" intensity={1.0} distance={8} />

        <Suspense fallback={null}>
          {/* Neon Retro-grid road */}
          <InfiniteRoadGrid scrollProgress={scrollProgress} />
          
          {/* Animating Sports Car */}
          <ProceduralCar scrollProgress={scrollProgress} isMobile={isMobile} />
        </Suspense>
      </Canvas>
    </div>
  )
}
