import logo from "@/assets/wma-logo.png";

export function Nav() {
  const links = [
    { href: "#problem", label: "Threats" },
    { href: "#watch", label: "Watch" },
    { href: "#shield", label: "Shield" },
    { href: "#loop", label: "Feedback Loop" },
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
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="hover:text-primary transition-colors">{l.label}</a>
            </li>
          ))}
        </ul>
        <a
          href="#cta"
          className="text-xs font-mono uppercase tracking-widest px-4 py-2 rounded-md border border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
        >
          Request Access
        </a>
      </nav>
    </header>
  );
}
