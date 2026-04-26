import Image from "next/image";
import Link from "next/link";

const sizeClass = {
  sm: "h-9 w-auto md:h-10",
  md: "h-12 w-auto md:h-14",
  lg: "h-14 w-auto max-w-full md:h-16",
} as const;

type Props = {
  /** Pass `null` to render logo without a link */
  href?: string | null;
  size?: keyof typeof sizeClass;
  className?: string;
  priority?: boolean;
};

export function MiddletonLogo({
  href = "/",
  size = "md",
  className = "",
  priority,
}: Props) {
  const img = (
    <Image
      src="/middletonFitnessLogo.svg"
      alt="Middleton Fitness Center"
      width={560}
      height={131}
      className={`${sizeClass[size]} ${className}`.trim()}
      priority={priority}
    />
  );

  if (href != null) {
    return (
      <Link
        href={href}
        className="inline-block shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
      >
        {img}
      </Link>
    );
  }

  return <span className="inline-block shrink-0">{img}</span>;
}
