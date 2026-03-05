import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  href?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  priority?: boolean;
};

const sizeMap = {
  sm: { width: 170, height: 42 },
  md: { width: 220, height: 54 },
  lg: { width: 290, height: 72 },
} as const;

export function BrandLogo({
  href,
  className,
  size = "md",
  priority = false,
}: BrandLogoProps) {
  const dimensions = sizeMap[size];
  const image = (
    <Image
      src="/simuvaction-logo.svg"
      alt="SimuVaction logo"
      width={dimensions.width}
      height={dimensions.height}
      priority={priority}
      className={className}
    />
  );

  if (!href) {
    return image;
  }

  return <Link href={href}>{image}</Link>;
}
