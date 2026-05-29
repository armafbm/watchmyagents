import logo from "@/assets/wma-logo.png";
import watchIcon from "@/assets/wma-icon-watch.png";
import guardianIcon from "@/assets/wma-icon-guardian.png";
import shieldIcon from "@/assets/wma-icon-shield.png";
import fortressIcon from "@/assets/wma-fortress.png";
import legionsImg from "@/assets/wma-legions.png";

import { useAuth } from "@/hooks/use-auth";
import { Link } from "@tanstack/react-router";
import { Shield, ChevronDown, AlertTriangle, Cpu, RefreshCw, Download, Lock, Rocket } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Nav() {
  const { user } = useAuth();

  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-background/60 border-b border-border/50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="WatchMyAgents" className="h-9 w-9 rounded-md" />
          <span className="font-display font-bold tracking-wider text-sm">
            WATCH<span className="text-primary">MY</span>AGENTS
          </span>
        </Link>
        <ul className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
          <li>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 hover:text-primary transition-colors outline-none">
                What the f*** ?
                <ChevronDown className="h-3.5 w-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-64">
                <DropdownMenuItem asChild>
                  <Link to="/" hash="problem" className="flex items-center gap-2 cursor-pointer">
                    <AlertTriangle className="h-5 w-5 text-primary icon-neon-glow" />
                    Threats
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/" hash="recursive-fractal" className="flex items-center gap-2 cursor-pointer">
                    <Cpu className="h-5 w-5 text-primary icon-neon-glow" />
                    Our technology
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/" hash="watch" className="flex items-center gap-2 cursor-pointer">
                    <img src={watchIcon} alt="" className="h-5 w-5 object-contain icon-neon-glow" />
                    Watch
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/" hash="guardian" className="flex items-center gap-2 cursor-pointer">
                    <img src={guardianIcon} alt="" className="h-5 w-5 object-contain icon-neon-glow" />
                    Guardian AI
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/" hash="shield" className="flex items-center gap-2 cursor-pointer">
                    <img src={shieldIcon} alt="" className="h-5 w-5 object-contain icon-neon-glow" />
                    Shield
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/legions" className="flex items-center gap-2 cursor-pointer">
                    <img src={legionsImg} alt="" className="h-5 w-5 object-contain icon-neon-glow" />
                    Legions
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/" hash="fractal" className="flex items-center gap-2 cursor-pointer">
                    <RefreshCw className="h-5 w-5 text-primary icon-neon-glow" />
                    How it works
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/" hash="dashboard" className="flex items-center gap-2 cursor-pointer">
                    <img src={fortressIcon} alt="" className="h-5 w-5 object-contain icon-neon-glow" />
                    Fortress
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/" hash="install" className="flex items-center gap-2 cursor-pointer">
                    <Download className="h-5 w-5 text-primary icon-neon-glow" />
                    How to install
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/" hash="privacy" className="flex items-center gap-2 cursor-pointer">
                    <Lock className="h-5 w-5 text-primary icon-neon-glow" />
                    Privacy by design
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/" hash="cta" className="flex items-center gap-2 cursor-pointer">
                    <Rocket className="h-5 w-5 text-primary icon-neon-glow" />
                    Early access
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
          <li>
            <Link to="/pricing" className="hover:text-primary transition-colors">
              Pricing
            </Link>
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
              <Link
                to="/auth/signin"
                className="hidden sm:inline text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/auth/signup"
                className="text-xs font-mono uppercase tracking-widest px-4 py-2 rounded-md border border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
