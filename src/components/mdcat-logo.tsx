import Image from "next/image";
import Link from "next/link";

const LOGO_SRC = "/mdcat_exper_logo-removebg-preview.png";

const sizeMap = {
  sm: {
    height: 40,
    width: 40,
    imageClass: "h-10 w-10",
    textClass: "text-lg sm:text-xl",
    gap: "gap-2.5",
    hideNameBelow: "sm" as const,
  },
  md: {
    height: 44,
    width: 44,
    imageClass: "h-11 w-11",
    textClass: "text-xl sm:text-2xl",
    gap: "gap-3",
    hideNameBelow: undefined,
  },
  lg: {
    height: 52,
    width: 52,
    imageClass: "h-[52px] w-[52px]",
    textClass: "text-2xl",
    gap: "gap-3",
    hideNameBelow: undefined,
  },
} as const;

type MdcatLogoProps = {
  href?: string;
  size?: keyof typeof sizeMap;
  className?: string;
  priority?: boolean;
  showName?: boolean;
};

function BrandName({ textClass }: { textClass: string }) {
  return (
    <span className={`font-black text-gray-900 tracking-tight whitespace-nowrap ${textClass}`}>
      Mdcat<span className="text-primary-600">Xpert</span>
    </span>
  );
}

export default function MdcatLogo({
  href = "/",
  size = "md",
  className = "",
  priority = false,
  showName = true,
}: MdcatLogoProps) {
  const { height, width, imageClass, textClass, gap, hideNameBelow } = sizeMap[size];

  const nameVisibility =
    hideNameBelow === "sm" ? "hidden sm:inline" : "inline";

  const content = (
    <>
      <Image
        src={LOGO_SRC}
        alt=""
        aria-hidden
        width={width}
        height={height}
        priority={priority}
        className={`object-contain object-center shrink-0 ${imageClass}`}
      />
      {showName && (
        <BrandName textClass={`${textClass} ${nameVisibility}`} />
      )}
    </>
  );

  const wrapperClass = `inline-flex items-center ${gap} shrink-0 ${className}`;

  if (!href) {
    return <div className={wrapperClass}>{content}</div>;
  }

  return (
    <Link
      href={href}
      aria-label="MdcatXpert"
      className={`${wrapperClass} active:scale-95 transition-transform`}
    >
      {content}
    </Link>
  );
}
