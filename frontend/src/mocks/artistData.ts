export type Artwork = {
  id: string;
  title: string;
  image: string;
  likes: number;
  timeAgo: string;
  isWip?: boolean;
};

export type Artist = {
  username: string;
  displayName: string;
  avatar: string;
  coverImage: string;
  bio: string;
  location: string;
  website: string;
  badges: Array<{ label: string; variant: 'primary' | 'default' }>;
  stats: {
    followers: number;
    following: number;
    views: number;
  };
  socials: {
    twitter?: string;
    instagram?: string;
  };
  artworks: Artwork[];
  categories: Array<{ name: string; count: number }>;
};

export const mockArtist: Artist = {
  username: 'ariachen_art',
  displayName: 'Aria Chen',
  avatar:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBrcjQ7Pw88MDS3uYmWU9E4PuZ8DQjpgzzVr01bSl7iAQbyMb0L6-nRrZDTAE_iNdx2s_3r7FRXXkwhJHEirCT2GTnp5Mo20fb6AgmLI4PUYN85QlUjlCQLQ4EHCgpqqf5MjJhNh5DLGMFbDhc4LcaEX_lrWl-9tTqvfk66vnVKRZbDtZBfAwg13qtTE-vpxxDxAOfIiiuMwRVLNCk_wRFr_14M041vgbaZ-5NgthWucG4nZPO_ymRPWNWgZVwFdINm5oWqEKXNlYA',
  coverImage:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuA5hu6GbWKGhOoQx-8Ek3vpmdsAoujuvO2PQlfAUUZgSNz7Qtspfcnz-qoZlHcAbwSGLyGF207oqkeFbv2fXhuYyMhwWHnkfI0Y_GpucXrmgEvhuX3fIXxHyB4qxHA9S9kyrzZyzZ0ERpFOXuNAZH4rGuS_LSnAKyCq1SIFCTQGq5yAGzp4OuuukGp1KnbpGs77M9rlnvnmm7z4umjXCffKcuekoWrwNQ6dQk9PMnU2Y_aKH1gR62OVdbqAE26eLGNENfdaT3KNILU',
  bio: 'Digital illustrator specializing in futuristic environments and character design. Based in Tokyo. Currently open for freelance commissions! ✨',
  location: 'Tokyo, Japan',
  website: 'ariachen.art',
  badges: [
    { label: 'Pro', variant: 'primary' },
    { label: 'Concept Art', variant: 'default' },
  ],
  stats: {
    followers: 24500,
    following: 120,
    views: 1200000,
  },
  socials: {
    twitter: 'https://twitter.com/ariachen_art',
    instagram: 'https://instagram.com/ariachen_art',
  },
  categories: [
    { name: 'Illustrations', count: 24 },
    { name: 'Manga', count: 4 },
    { name: 'Sketches', count: 18 },
    { name: 'Collections', count: 0 },
    { name: 'About', count: 0 },
  ],
  artworks: [
    {
      id: '1',
      title: 'Neon Rain',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBjseE8oP672aRxFexdPip4Dk3sayeYXMRu8G-qpDDn_u28bXSQtuJP8J0Vc-vbUCElwvADinFoLl2JalV_6LU-VPVANU97o9Am0FVeOuKF5Ns2t4EhAgLWTwGuWBuv9TWA2jwOHVzd9kH9z3agMiTbqgWHcAhu6R_1omZUVwavdDmoRzWy_OzxnQK9s_a90Jl3C75oJm4Eor9LzPYvblKaVKYuzEAX7mqTsQ3gAhKdiXxLmfmy2WRNLOrwZjAKZxRDaNh8LDNnjwU',
      likes: 1200,
      timeAgo: '2 hours ago',
    },
    {
      id: '2',
      title: 'Cyber Void',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAEOuMUYn2x42AZl14ARSTKCwq970viGf_Q54SamW0qbotVII77Ep9nLRldJCm1L0O4XkvIigl9cyWDyNIOn7sdqZjsbDecb4PODlnt-wfLF1MhhAprrv1vqQr2izLrflFNTn4j7u5y0noKRrEzSPbLGt7j2nB70PuO3XqK8qwNer0pJXs99L7x_iNNzpiTgyulbpLi03HqV_z2g4XmgRFTydANCzcFRqoyz8xyDQgn-uNC2KODaPk4-Nvem-gUrlzHeVLI42DEeYs',
      likes: 856,
      timeAgo: 'Yesterday',
    },
    {
      id: '3',
      title: 'Liquid Metal',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAG9Db2iTUl7R8TyUn-kn4ltFvUBvtwQ8wyRrbHzOr11dIznovAlw23I5V2rCPS5tK1QsL5W8ZDzYTRfcjBiwLD6dZUo0ydPubFczMcNcGxLbuKVh6lwhTYGG8nNWRT2DmqpetLBUIbQyymwUDHMeId8A758neHyld8bYaKsxfR-RqDJB3ao0RCSORqNYHPR6osrnWYN3R4tVNWGddaoJgHjQGFrrbduTA9J1FzHZVLcRFUKpoiYZxBPyOOkqkjpuK47Ej9JFzkOMs',
      likes: 2400,
      timeAgo: '3 days ago',
    },
    {
      id: '4',
      title: 'The Forbidden Forest',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBeSd4QJ1MZn07EdRCYSY-W9mPYFkIndgtgLnlYD7EgMxV6unCpWnMziv7cb5QZG-arzpVEbBIcLrq1DgJGfuP55zKPHMSThAcGmvEh3USk-3yAxqkNe2_jRJBtvkYQQlV3D_BeJ7XRIAxpuhd2zX5LIVmOG_yYAmA-ZFnLTTnLUpttwKTIGwGKRgDDpxMce5AwAdzRuCT0-8z3BChew1hJt2mbBsz2KijDsNvFY-lfKVX1UcuV5sx9yQ1CCJb-pwGHULZnuolfOEI',
      likes: 420,
      timeAgo: '5 days ago',
      isWip: true,
    },
    {
      id: '5',
      title: 'Solar Flare',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBgeIfxPjJ2iQLq84wZlGIl0i2SpoYKiGuDQ-DyCkMxmWXrwgJZ3k3m9AjueOOHJZCylWxudO5fRLVC_sXRs3cYQwq1qq0mZy1FBHzPtXTrYuiITVk8wmnxquF705rH4HjOGAzDywdwgWkUmT118pIx2gj7e1kZC0pDjs2ZXCHMSpQkjtP2mD0XllkCNmX4saZBCsXbQHoJwGhCsPNgNPVNjafTzIF26cxp2b87jqiBc3UVBH2EdKtP-Z-m1bshLFgJ-rLvQcHrweg',
      likes: 3100,
      timeAgo: '1 week ago',
    },
    {
      id: '6',
      title: 'Chromatic Dreams',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCuGVivbko3ByEGTWF3stt_cxQUpSIp-ZoKxWU59XIl9Sw66F4rKKykzvAvZ7u1haVPmQI22TuZmWsYJzQwIFKUn0ru-qgc1NQ8_q7r0o8ytmBWplgxaz126d0SbjxgIgbesENtZCSr3UPv6XZd3MPQ1FhDeDA8f65isQRs8YfvdTFg-vWLXMT_JTm2_0UMLDgqswo0fmFS2S61gt6p_GigMj5kh4fggeriJJjAFNUhy5tbjg2-pxhP1UI4JR-q_zZElTw_8i1Oz_Y',
      likes: 900,
      timeAgo: '2 weeks ago',
    },
  ],
};

// Helper function to format numbers (e.g., 24500 -> "24.5k")
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return num.toString();
}
