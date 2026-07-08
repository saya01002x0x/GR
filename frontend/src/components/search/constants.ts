export enum SortOption {
  NEWEST = 'newest',
  OLDEST = 'oldest',
  POPULAR = 'popular',
}

export enum RatioOption {
  PORTRAIT = 'portrait',
  LANDSCAPE = 'landscape',
  SQUARE = 'square',
}

export enum ResolutionOption {
  HD = 'hd',
  FULL_HD = 'full_hd',
  TWO_K = '2k',
  FOUR_K = '4k',
}

export const RESOLUTION_LABELS: Record<ResolutionOption, string> = {
  [ResolutionOption.HD]: 'HD',
  [ResolutionOption.FULL_HD]: 'Full HD',
  [ResolutionOption.TWO_K]: '2K',
  [ResolutionOption.FOUR_K]: '4K',
};
