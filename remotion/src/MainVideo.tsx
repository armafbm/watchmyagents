import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";

import { Background } from "./components/Background";
import { Scene1Intro } from "./scenes/Scene1Intro";
import { Scene2Problem } from "./scenes/Scene2Problem";
import { Scene3Loop } from "./scenes/Scene3Loop";
import { Scene4Landing } from "./scenes/Scene4Landing";
import { Scene5Dashboard } from "./scenes/Scene5Dashboard";
import { Scene6Account } from "./scenes/Scene6Account";
import { Scene7AddAgent } from "./scenes/Scene7AddAgent";
import { Scene8Outro } from "./scenes/Scene8Outro";

export const MainVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Background />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={360}>
          <Scene1Intro />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 20 })} />

        <TransitionSeries.Sequence durationInFrames={300}>
          <Scene2Problem />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-right" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: 25 })} />

        <TransitionSeries.Sequence durationInFrames={480}>
          <Scene3Loop />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 20 })} />

        <TransitionSeries.Sequence durationInFrames={420}>
          <Scene4Landing />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: 25 })} />

        <TransitionSeries.Sequence durationInFrames={480}>
          <Scene5Dashboard />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 20 })} />

        <TransitionSeries.Sequence durationInFrames={240}>
          <Scene6Account />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-bottom" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: 25 })} />

        <TransitionSeries.Sequence durationInFrames={720}>
          <Scene7AddAgent />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 25 })} />

        <TransitionSeries.Sequence durationInFrames={360}>
          <Scene8Outro />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
