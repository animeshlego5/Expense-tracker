"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function iconBase(props: IconProps) {
  return {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  };
}

function HouseIcon(props: IconProps) {
  return (
    <svg {...iconBase(props)}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </svg>
  );
}

function ReceiptIcon(props: IconProps) {
  return (
    <svg {...iconBase(props)}>
      <path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-1 2z" />
      <path d="M8 8h8M8 12h8" />
    </svg>
  );
}

function BanknoteIcon(props: IconProps) {
  return (
    <svg {...iconBase(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M8.5 13.5 12 17l3.5-3.5" />
    </svg>
  );
}

function GearIcon(props: IconProps) {
  return (
    <svg {...iconBase(props)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1" />
    </svg>
  );
}

const items = [
  { href: "/dashboard", label: "Dashboard", Icon: HouseIcon },
  { href: "/expenses", label: "Expenses", Icon: ReceiptIcon },
  { href: "/income", label: "Income", Icon: BanknoteIcon },
  { href: "/settings", label: "Settings", Icon: GearIcon },
];

export function AppShell() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {/* Desktop top bar */}
      <header className="sticky top-0 z-20 hidden border-b border-hairline bg-surface md:block">
        <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between px-4">
          <span className="font-semibold text-ink">Expense Tracker</span>
          <nav className="flex items-center gap-6 text-sm">
            {items.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                className={
                  isActive(it.href)
                    ? "font-medium text-ink underline underline-offset-4"
                    : "text-ink-soft transition-colors hover:text-ink"
                }
              >
                {it.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-hairline bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="flex h-14 items-stretch">
          {items.map(({ href, label, Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-1 flex-col items-center justify-center gap-1 ${
                  active ? "font-medium text-ink" : "text-ink-soft"
                }`}
              >
                <Icon />
                <span className="text-[10px] leading-none">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
