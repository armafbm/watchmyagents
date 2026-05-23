import mascot from "@/assets/wma-mascot.png";

export function Logo3D({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {/* Soft glow */}
      <div className="absolute inset-0 rounded-full bg-primary/20 blur-3xl" />

      {/* Pulse rings */}
      <div className="absolute inset-8 rounded-full border border-primary/30 animate-pulse-ring" />
      <div
        className="absolute inset-8 rounded-full border border-accent/30 animate-pulse-ring"
        style={{ animationDelay: "1.2s" }}
      />

      {/* Mascot — lightweight CSS float, no WebGL */}
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src={mascot}
          alt="WatchMyAgents guardian mascot"
          loading="lazy"
          decoding="async"
          className="w-[78%] h-[78%] object-contain drop-shadow-[0_20px_40px_rgba(80,140,255,0.35)] animate-float"
        />
      </div>
    </div>
  );
}
