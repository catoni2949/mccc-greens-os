"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  CheckSquare,
  Map,
  TreePine,
  DollarSign,
  Users,
  MessageSquare,
  LogOut,
  Menu,
  History,
  Crown,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/meetings", label: "Meetings", icon: CalendarDays },
  { href: "/actions", label: "Actions", icon: CheckSquare },
  { href: "/strategic-plan", label: "Strategic Plan", icon: Map },
  { href: "/trees", label: "Trees", icon: TreePine },
  { href: "/capital", label: "Capital", icon: DollarSign },
  { href: "/committee", label: "Committee", icon: Users },
  { href: "/communications", label: "Communications", icon: MessageSquare },
  { href: "/timeline", label: "Timeline", icon: History },
  { href: "/chair", label: "Chair", icon: Crown },
  { href: "/governance", label: "Governance", icon: BookOpen },
] as const;

const mobileNavItems = navItems.slice(0, 5);

function NavLink({
  href,
  label,
  icon: Icon,
  compact,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  compact?: boolean;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium no-underline transition-colors",
        active
          ? "bg-green-50 text-green-700"
          : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
        compact && "min-w-0 flex-1 flex-col gap-1 px-1 py-2 text-[10px]"
      )}
    >
      <Icon
        className={cn("size-5 shrink-0 text-current", compact && "size-5")}
        aria-hidden
      />
      <span className={cn(compact && "truncate")}>{label}</span>
    </Link>
  );
}

export function AppShell({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail?: string | null;
}) {
  const router = useRouter();
  const initials =
    userEmail?.slice(0, 2).toUpperCase() ?? "MG";

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 md:flex-row">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white md:flex md:flex-col">
        <div className="border-b border-slate-200 px-4 py-5">
          <p className="text-lg font-semibold text-slate-900">MCCC Greens OS</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>
      </aside>

      <div className="flex min-h-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
          <div className="flex items-center gap-2 md:hidden">
            <Sheet>
              <SheetTrigger
                className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-slate-100"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </SheetTrigger>
              <SheetContent side="left" className="w-60 p-0">
                <SheetHeader className="border-b border-slate-200 px-4 py-5 text-left">
                  <SheetTitle>MCCC Greens OS</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-1 p-3">
                  {navItems.map((item) => (
                    <NavLink key={item.href} {...item} />
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
            <span className="font-semibold text-slate-900 md:hidden">
              MCCC Greens OS
            </span>
          </div>
          <span className="hidden font-semibold text-slate-900 md:block md:flex-1" />
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-green-600">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-green-100 text-green-800">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {userEmail && (
                <DropdownMenuItem disabled className="text-slate-500">
                  {userEmail}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 overflow-auto p-4 pb-20 md:pb-4">
          {children}
        </main>

        <nav
          className="fixed inset-x-0 bottom-0 z-10 flex border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
          aria-label="Primary mobile"
        >
          {mobileNavItems.map((item) => (
            <NavLink key={item.href} {...item} compact />
          ))}
        </nav>
      </div>
    </div>
  );
}
