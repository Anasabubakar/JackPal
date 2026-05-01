"use client";

import dynamic from "next/dynamic";

const FigmaLanding = dynamic(
  () => import("@/components/landing/FigmaLanding").then((mod) => mod.FigmaLanding),
  { ssr: false },
);

export default function Home() {
  return <FigmaLanding />;
}
