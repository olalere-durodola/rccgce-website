import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "gold" | "navy" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-body font-medium " +
  "transition-colors focus-ring-gold disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  gold: "bg-gold text-navy hover:bg-gold-deep",
  navy: "bg-navy text-cream hover:bg-royal",
  outline: "border border-gold text-gold bg-transparent hover:bg-gold/10",
  ghost: "bg-transparent text-gold hover:bg-gold/10",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-base",
  lg: "h-13 px-8 text-lg",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children?: React.ReactNode;
};

type ButtonAsButton = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & {
    href?: undefined;
  };

type ButtonAsLink = CommonProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export const Button = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonProps
>(function Button(
  { variant = "gold", size = "md", className, children, ...props },
  ref,
) {
  const classes = cn(base, variants[variant], sizes[size], className);

  if ("href" in props && props.href !== undefined) {
    const { href, ...rest } = props as ButtonAsLink;
    return (
      <Link
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        className={classes}
        {...rest}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      className={classes}
      {...(props as ButtonAsButton)}
    >
      {children}
    </button>
  );
});
