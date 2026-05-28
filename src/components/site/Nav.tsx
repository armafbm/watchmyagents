import logo from "@/assets/wma-logo.png";
import watchIcon from "@/assets/wma-icon-watch.png";
import guardianIcon from "@/assets/wma-icon-guardian.png";
import shieldIcon from "@/assets/wma-icon-shield.png";

import { useAuth } from "@/hooks/use-auth";
import { Link } from "@tanstack/react-router";
import { Shield, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Nav() {
  const { user } = useAuth();

  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-background/60 border-b border-border/50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-3">
          <img src={logo} alt="WatchMyAgents" className="h-9 w-9 rounded-md" />
          <span className="font-display font-bold tracking-wider text-sm">
            WATCH<span className="text-primary">MY</span>AGENTS
          </span>
        </a>
        <ul className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
          <li>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 hover:text-primary transition-colors outline-none">
                What the f*** ?
                <ChevronDown className="h-3.5 w-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-64">
                <DropdownMenuItem asChild>
                  <a href="#problem" className="cursor-pointer">Threats</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="#recursive-fractal" className="cursor-pointer">Our technology</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="#watch" className="flex items-center gap-2 cursor-pointer">
                    <img src={watchIcon} alt="" className="h-5 w-5 object-contain icon-neon-glow" />
                    Watch
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="#guardian" className="flex items-center gap-2 cursor-pointer">
                    <img src={guardianIcon} alt="" className="h-5 w-5 object-contain icon-neon-glow" />
                    Guardian AI
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="#shield" className="flex items-center gap-2 cursor-pointer">
                    <img src={shieldIcon} alt="" className="h-5 w-5 object-contain icon-neon-glow" />
                    Shield
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="#fractal" className="cursor-pointer">How it works</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="#dashboard" className="cursor-pointer">Fortress</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="#install" className="cursor-pointer">How to install</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="#privacy" className="cursor-pointer">Privacy by design</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="#cta" className="cursor-pointer">Early access</a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        </ul>

        <div className="flex items-center gap-3">
          {user ? (
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest px-4 py-2 rounded-md border border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
            >
              <Shield className="h-3.5 w-3.5 icon-neon-glow" />
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
