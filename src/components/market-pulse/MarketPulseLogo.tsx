import Image from "next/image";

const LOGO_SRC = "/images/market-pulse-logo.png";
const LOGO_WIDTH = 1024;
const LOGO_HEIGHT = 311;

type MarketPulseLogoProps = Readonly<{
  variant?: "hero" | "header" | "play";
  className?: string;
  priority?: boolean;
}>;

const variantClass = {
  hero: "h-11 w-auto max-w-full object-contain sm:h-16 md:h-20 lg:h-24",
  header: "h-7 w-auto max-w-full object-contain sm:h-8",
  play: "h-auto w-full max-h-9 object-contain sm:max-h-10",
} as const;

export default function MarketPulseLogo({
  variant = "hero",
  className = "",
  priority = false,
}: MarketPulseLogoProps) {
  return (
    <Image
      src={LOGO_SRC}
      alt="Market Pulse by PPA"
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      priority={priority}
      className={`${variantClass[variant]} ${className}`.trim()}
    />
  );
}
