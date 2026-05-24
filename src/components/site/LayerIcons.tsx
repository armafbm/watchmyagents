import watchIcon from "@/assets/wma-icon-watch.png";
import guardianIcon from "@/assets/wma-icon-guardian.png";
import shieldIcon from "@/assets/wma-icon-shield.png";

export const layerIcons = {
  watch: watchIcon,
  guardian: guardianIcon,
  shield: shieldIcon,
} as const;

export type LayerKey = keyof typeof layerIcons;

export function LayerIcon({
  layer,
  className = "h-5 w-5",
  alt,
}: {
  layer: LayerKey;
  className?: string;
  alt?: string;
}) {
  return (
    <img
      src={layerIcons[layer]}
      alt={alt ?? layer}
      className={`object-contain shrink-0 ${className}`}
    />
  );
}
