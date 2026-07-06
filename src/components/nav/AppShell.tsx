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
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

const allItems = [
  { href: "/dashboard", label: "Dashboard", Icon: HouseIcon },
  { href: "/expenses", label: "Expenses", Icon: ReceiptIcon },
  { href: "/income", label: "Income", Icon: BanknoteIcon },
  { href: "/settings", label: "Settings", Icon: GearIcon },
];

export function AppShell({ hideIncome = false }: { hideIncome?: boolean }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);
  const items = hideIncome
    ? allItems.filter((it) => it.href !== "/income")
    : allItems;

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
