import Image from "next/image";
import logoMark from "@/assets/brand/logo-mark.png";

export function BrandLogo({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={logoMark}
      alt="Jackpals logo"
      priority={priority}
      className={className}
      sizes="(max-width: 640px) 38px, 48px"
    />
  );
}
