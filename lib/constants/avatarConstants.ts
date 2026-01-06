// Hardcoded list of available avatar files in public/avatars
export const AVAILABLE_AVATARS = [
  "1F344_color.png",
  "1F348_color.png",
  "1F353_color.png",
  "1F369_color.png",
  "1F3B1_color.png",
  "1F414_color.png",
  "1F42D_color.png",
  "1F431_color.png",
  "1F436_color.png",
  "1F437_color.png",
  "1F438_color.png",
  "1F439_color.png",
  "1F5FF_color.png",
  "1F680_color.png",
  "1F94E_color.png",
  "1F95E_color.png",
  "1F9C1_color.png",
  "1F9F8_color.png",
  "1FA86_color.png",
  "1FAB7_color.png",
  "26BD_color.png",
  "26F8_color.png",
  "E283_color.png"
] as const;

export type AvatarName = (typeof AVAILABLE_AVATARS)[number];
