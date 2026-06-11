export const IMAGES = {
  placeholderAvatar: "https://i.pravatar.cc/300",
  placeholderGreenhouse:
    "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400",
  placeholderGreenhouse2:
    "https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?w=400",
  uiAvatar: (name: string) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`,
} as const;
