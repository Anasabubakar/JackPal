"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const WAVE_CONFIGS_FULL = [
  { amp: 0.28, freq: 1.4, speed: 0.38, yOff:  0.00, opacity: 0.70 },
  { amp: 0.18, freq: 2.3, speed: 0.55, yOff:  0.45, opacity: 0.40 },
  { amp: 0.22, freq: 1.8, speed: 0.42, yOff: -0.45, opacity: 0.50 },
  { amp: 0.12, freq: 3.1, speed: 0.70, yOff:  0.85, opacity: 0.24 },
  { amp: 0.14, freq: 2.8, speed: 0.30, yOff: -0.85, opacity: 0.24 },
  { amp: 0.08, freq: 4.2, speed: 0.90, yOff:  1.20, opacity: 0.13 },
  { amp: 0.08, freq: 3.8, speed: 0.60, yOff: -1.20, opacity: 0.13 },
];

const WAVE_CONFIGS_MOBILE = [
  { amp: 0.28, freq: 1.4, speed: 0.38, yOff:  0.00, opacity: 0.65 },
  { amp: 0.18, freq: 2.3, speed: 0.55, yOff:  0.45, opacity: 0.35 },
  { amp: 0.22, freq: 1.8, speed: 0.42, yOff: -0.45, opacity: 0.45 },
];

function Wave({
  amp, freq, speed, yOff, opacity, color, numPoints,
}: {
  amp: number; freq: number; speed: number; yOff: number;
  opacity: number; color: THREE.Color; numPoints: number;
}) {
  const lineRef = useRef<THREE.Line>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(numPoints * 3);
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [numPoints]);

  useFrame(({ clock }) => {
    if (!lineRef.current) return;
    const t = clock.elapsedTime * speed;
    const pos = geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < numPoints; i++) {
      const x = -5 + (i / (numPoints - 1)) * 10;
      const env = Math.sin((Math.PI * i) / (numPoints - 1));
      pos[i * 3]     = x;
      pos[i * 3 + 1] = amp * env * Math.sin(freq * x + t) + yOff;
      pos[i * 3 + 2] = 0;
    }
    geometry.attributes.position.needsUpdate = true;
  });

  return (
    // @ts-expect-error — lowercase three.js element
    <line ref={lineRef} geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={opacity} />
    </line>
  );
}

function Scene({ colorHex, mobile }: { colorHex: string; mobile: boolean }) {
  const color    = useMemo(() => new THREE.Color(colorHex), [colorHex]);
  const configs  = mobile ? WAVE_CONFIGS_MOBILE : WAVE_CONFIGS_FULL;
  const nPoints  = mobile ? 80 : 160;

  return (
    <>
      {configs.map((cfg, i) => (
        <Wave key={i} {...cfg} color={color} numPoints={nPoints} />
      ))}
    </>
  );
}

export function HeroWave() {
  const [colorHex, setColorHex] = useState("#5AA3F5");
  const [mobile,   setMobile]   = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setMobile(mq.matches);
    const onMQ = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener("change", onMQ);

    function update() {
      const isLight = document.documentElement.getAttribute("data-theme") === "light";
      setColorHex(isLight ? "#2C7BE5" : "#5AA3F5");
    }
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      observer.disconnect();
      mq.removeEventListener("change", onMQ);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 w-full h-full" aria-hidden>
      <Canvas
        camera={{ position: [0, 0, 3.5], fov: 55 }}
        gl={{ antialias: !mobile, alpha: true, powerPreference: "low-power" }}
        style={{ background: "transparent" }}
        dpr={mobile ? 1 : [1, 1.5]}
      >
        <Scene colorHex={colorHex} mobile={mobile} />
      </Canvas>
    </div>
  );
}
