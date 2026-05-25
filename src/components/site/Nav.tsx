import logo from "@/assets/wma-logo.png";
import watchIcon from "@/assets/wma-icon-watch.png";
import fortressIcon from "@/assets/wma-fortress-castle-cutout.png";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "@tanstack/react-router";
import { Shield } from "lucide-react";

export function Nav() {
  const { user } = useAuth();

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
            <a href="#fractal" className="flex items-center gap-2 hover:text-primary transition-colors">
              <img src={watchIcon} alt="" className="h-5 w-5 object-contain icon-neon-glow" />
              WGS
            </a>
          </li>
          <li>
            <a href="#guardian" className="hover:text-primary transition-colors">
              Guardian AI
            </a>
          </li>
          <li>
            <a href="#dashboard" className="flex items-center gap-2 hover:text-primary transition-colors">
              <img src={fortressIcon} alt="" className="h-6 w-6 object-contain icon-neon-glow" />
              Fortress
            </a>
          </li>
          <li>
            <Link to="/dashboard/legions" className="hover:text-primary transition-colors">
              Legions
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
