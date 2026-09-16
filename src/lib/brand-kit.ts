import type { IdeaInput, ProductBrief, Tone, BrandKit } from "./types";

const TONE_PALETTES: Record<
  Tone,
  { primary: string; accent: string; voice: string[] }
> = {
  professional: {
    primary: "#0f172a",
    accent: "#38bdf8",
    voice: ["polished", "trustworthy", "clear"],
  },
  playful: {
    primary: "#1a1033",
    accent: "#34d399",
    voice: ["friendly", "energetic", "curious"],
  },
  bold: {
    primary: "#0c0a09",
    accent: "#fb923c",
    voice: ["confident", "direct", "bold"],
  },
  minimal: {
    primary: "#09090b",
    accent: "#e4e4e7",
    voice: ["clean", "precise", "calm"],
  },
  friendly: {
    primary: "#1a0f0a",
    accent: "#fdba74",
    voice: ["warm", "approachable", "helpful"],
  },
};

/**
 * Derive a stable BrandKit once from the refined brief + tone.
 * Same inputs → same colours / voice / mark letter.
 */
export function deriveBrandKit(
  input: IdeaInput,
  brief: ProductBrief
): BrandKit {
  const tone = input.tone || "professional";
  const palette = TONE_PALETTES[tone] || TONE_PALETTES.professional;
  const name = brief.selectedName || "Nova";
  const letter = (name.replace(/[^a-zA-Z0-9]/g, "").charAt(0) || "F").toUpperCase();

  return {
    name,
    primary: palette.primary,
    accent: palette.accent,
    voiceAdjectives: palette.voice,
    logoMarkLetter: letter,
  };
}
