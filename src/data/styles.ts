import { assetUrl } from "./base";

export interface Style {
  id: string;
  name: string;
  image: string;
  /** optional background image used behind normal result visuals */
  bgImage?: string;
  /** css gradient fallback for the result backdrop */
  bgGradient: string;
}

export const STYLES: Style[] = [
  {
    id: "cyber",
    name: "CYBER",
    image: assetUrl("styles", "cyber.png"),
    bgImage: assetUrl("backgrounds", "cyber-city.png"),
    bgGradient: "linear-gradient(160deg, #0b1e3f 0%, #14306b 55%, #2e9bff 130%)",
  },
  {
    id: "space",
    name: "SPACE",
    image: assetUrl("styles", "space.png"),
    bgImage: assetUrl("backgrounds", "moon-space.png"),
    bgGradient: "linear-gradient(160deg, #060a1f 0%, #1a1440 60%, #4b2a8a 130%)",
  },
  {
    id: "street",
    name: "STREET",
    image: assetUrl("styles", "street.png"),
    bgGradient: "linear-gradient(160deg, #2b2b2b 0%, #4a4a52 55%, #8a8f9c 130%)",
  },
  {
    id: "pixel",
    name: "PIXEL",
    image: assetUrl("styles", "pixel.png"),
    bgGradient: "linear-gradient(160deg, #123d2b 0%, #1f7a4d 55%, #39ff14 160%)",
  },
  {
    id: "anime",
    name: "ANIME",
    image: assetUrl("styles", "anime.png"),
    bgGradient: "linear-gradient(160deg, #ffd9ec 0%, #ff9ecb 55%, #b7f0ff 130%)",
  },
  {
    id: "retro",
    name: "RETRO",
    image: assetUrl("styles", "retro.png"),
    bgGradient: "linear-gradient(160deg, #2a0a4a 0%, #7a1fa2 55%, #ff7a1a 130%)",
  },
  {
    id: "dark",
    name: "DARK",
    image: assetUrl("styles", "dark.png"),
    bgGradient: "linear-gradient(160deg, #05060a 0%, #101426 60%, #27304d 130%)",
  },
  {
    id: "cute",
    name: "CUTE",
    image: assetUrl("styles", "cute.png"),
    bgImage: assetUrl("backgrounds", "soft-clouds.png"),
    bgGradient: "linear-gradient(160deg, #ffeef5 0%, #ffd9ec 55%, #d9f7ff 130%)",
  },
  {
    id: "degen",
    name: "DEGEN",
    image: assetUrl("styles", "degen.png"),
    bgGradient: "linear-gradient(160deg, #04140a 0%, #0a2e17 55%, #39ff14 150%)",
  },
  {
    id: "future",
    name: "FUTURE",
    image: assetUrl("styles", "future.png"),
    bgGradient: "linear-gradient(160deg, #04121f 0%, #0a2a4a 55%, #2ee6ff 150%)",
  },
];

export const STYLE_MAP = new Map(STYLES.map((s) => [s.id, s]));
