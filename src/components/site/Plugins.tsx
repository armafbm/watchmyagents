import knightWatch from "@/assets/wma-knight-watch.png";

export function Plugins() {
  return (
    <section className="relative py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-[1.4fr_0.6fr] gap-10 items-center">
          <div className="max-w-3xl">
            <div className="eyebrow mb-4">// Three layers, one mission</div>
            <h2 className="text-4xl md:text-5xl font-bold">
              <span className="text-gradient">Watch</span> sees everything.{" "}
              <span className="text-gradient">Guardian AI</span> thinks.{" "}
              <span className="text-gradient">Shield</span> stops the rest.
            </h2>
          </div>
          <div className="flex justify-center lg:justify-end">
            <img
              src={knightWatch}
              alt="WatchMyAgents knight guardian with all-seeing eye shield"
              className="h-48 sm:h-64 lg:h-80 w-auto max-w-full object-contain animate-float"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
