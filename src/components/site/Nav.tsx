import logo from "@/assets/wma-logo.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "@tanstack/react-router";
import { ChevronDown, Shield, User } from "lucide-react";

export function Nav() {
  const { user } = useAuth();

  const whatIsItLinks = [
    { href: "#problem", label: "Threats" },
    { href: "#watch", label: "Watch" },
    { href: "#guardian", label: "Guardian AI" },
    { href: "#shield", label: "Shield" },
    { href: "#loop", label: "Loop" },
    { href: "#dashboard", label: "Dashboard" },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-background/60 border-b border-border/50">
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-3">
          <img src={logo} alt="WatchMyAgents" className="h-9 w-9 rounded-md" />
          <span className="font-display font-bold tracking-wider text-sm">
            WATCH<span className="text-primary">MY</span>AGENTS
          </span>
        </a>
        <ul className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
          <li>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer outline-none">
                What is it?
                <ChevronDown className="w-3.5 h-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="bg-popover/95 backdrop-blur-xl border-border/50"
              >
                {whatIsItLinks.map((l) => (
                  <DropdownMenuItem key={l.href} asChild>
                    <a
                      href={l.href}
                      className="hover:text-primary cursor-pointer"
                    >
                      {l.label}
                    </a>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
          <li>
            <a href="#fractal" className="hover:text-primary transition-colors">
              Technology
            </a>
          </li>
          <li>
            <a href="#install" className="hover:text-primary transition-colors">
              Install
            </a>
          </li>
        </ul>
        <div className="flex items-center gap-3">
          {user ? (
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest px-4 py-2 rounded-md border border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
            >
              <Shield className="h-3.5 w-3.5" />
              My Fortress
            </Link>
          ) : (
            <>
              <a
                href="/auth/signin"
                className="hidden sm:inline text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign in
              </a>
              <a
                href="/auth/signup"
                className="text-xs font-mono uppercase tracking-widest px-4 py-2 rounded-md border border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
              >
                Sign up
              </a>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
