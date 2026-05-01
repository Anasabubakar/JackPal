import Image from "next/image";

/** Primary horizontal wordmark — nav, auth pages, dashboard, compact headers. */
export const JACKPALS_WORDMARK = "/images/Jackpals Logo 4 1.png";

/** Wide lockup for footer and large brand columns. */
export const JACKPALS_FOOTER_LOCKUP = "/images/Jackpals Logo 3 1.png";

/** Compact mark for tight circular / avatar-style placements (e.g. conditions orb). */
export const JACKPALS_MARK = "/images/Jackpals Logo 2 1.png";

type Variant = "wordmark" | "footer" | "mark";

const variantConfig: Record<
  Variant,
  { src: string; width: number; height: number; defaultClassName: string }
> = {
  wordmark: {
    src: JACKPALS_WORDMARK,
    width: 164,
    height: 36,
    defaultClassName: "h-9 w-auto",
  },
  footer: {
    src: JACKPALS_FOOTER_LOCKUP,
    width: 252,
    height: 57,
    defaultClassName: "h-auto w-full max-w-[252px]",
  },
  mark: {
    src: JACKPALS_MARK,
    width: 74,
    height: 74,
    defaultClassName: "",
  },
};

/**
 * Jackpals brand images — use the right variant: wordmark (default UI), footer (lockup), mark (small/orb).
 */
export function JackpalsLogo({
  variant,
  className,
  priority,
  sizes,
  alt = "Jackpals",
}: {
  variant: Variant;
  className?: string;
  priority?: boolean;
  sizes?: string;
  alt?: string;
}) {
  const cfg = variantConfig[variant];
  return (
    <Image
      src={cfg.src}
      alt={alt}
      width={cfg.width}
      height={cfg.height}
      priority={priority}
      sizes={sizes}
      className={className !== undefined ? className : cfg.defaultClassName || undefined}
    />
  );
}
