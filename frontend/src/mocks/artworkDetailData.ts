// Types
export type ArtworkDetail = {
  id: string;
  title: string;
  image: string;
  likes: number;
  views: string;
  createdAt: string;
  description: string;
  tags: string[];
  artist: {
    id: string;
    name: string;
    avatar: string;
    role: string;
  };
  specs: {
    size: string;
    software: string;
    license: string;
  };
};

export type Comment = {
  id: string;
  author: { name: string; avatar: string };
  content: string;
  timeAgo: string;
};

export type RelatedArtwork = {
  id: string;
  title: string;
  image: string;
  artist: string;
};

// Mock Data
export const mockArtworkDetail: ArtworkDetail = {
  id: 'artwork-1',
  title: 'Ethereal Dreams in the Sky',
  image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCsWkKepOvaAsT5c8o-VVWPirAjqRsQPdRH-t15QqWcR1Ls7EdJusyrGTM8Apf-i2Q2STy8OSgcPqv34I7M-Ozb_EdFeSLAPOpJ9ZLV6DPdlAw5B34fJBiRJO77DCif84sNRBCaVmVNGzNyc60SsLQlIb0RbpclTfkKLR4cChnQu1_XiKKBjhqwLUHKBLbPOXLpg83k2tfIuE0VmKbBWTI-pTVFdo8GZLN2x_Hravd72HKW1a2K2rrUbrNmd88RMN-EXUO-reILEGQ',
  likes: 12400,
  views: '12.4k',
  createdAt: 'Oct 24, 2023',
  description: 'A concept art piece exploring the beauty of floating islands and ethereal landscapes. This work combines traditional painting techniques with digital tools to create a dreamlike atmosphere that invites viewers to imagine a world beyond our own.',
  tags: ['#fantasy', '#digitalart', '#concept', '#scifi', '#clouds'],
  artist: {
    id: 'artist-1',
    name: 'SakuraArt_99',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAxQOVJSpSRDA2gRFg73dmTYjzmsw-gcDjw05jBwxfW_cgLVCPjga0IWp_PE6LFz0J03kKF-xp4J4B5uXIpaBsStpzJPVDrWTrIXr0sIIW5kiaBt9aWierKp88u1S9n3gziovOBzUrCi2zvq7v2ab-Wn7AzUaAQUJ3NoK1qIFQvn8DFdSFE51WNJWW-TQbz0j93cCJ_tbGs2n7T0EVEtbsdJpH2qrbFk0qSI0spBw-rx1Wq_-R0AjyFwGpcUqjE5EsPL4_tMwIgyDU',
    role: 'Digital Illustrator | Fantasy',
  },
  specs: {
    size: '3840 x 2160 px',
    software: 'Adobe Photoshop',
    license: 'CC BY-NC',
  },
};

export const mockComments: Comment[] = [
  {
    id: 'comment-1',
    author: {
      name: 'AlexDesign',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAjk9qh1MThIXjnvZ_JGjRqKKG85Ug2k3mS3DFXKOIhVnItfF4ND530Ct8bxZSn-DAavLLkOXgpJl7POHIg9Lp6wWNLhPKJDdFKuV-6Q7OVP5oy6l_avSQxTznHRmW86GdcG-M5mohs36gQSCy7VMSLHpEjHs3xCVP7WkYltDDFdILsueXhsuPjqsKlFsCZ080a5LiFbDbJqjZMrerzbEpcdHUuiN1jkM5wAhTe1jMA8wZr-FOOXQli3gO6jLzcx3XtpQUX4Efg4JI',
    },
    content: 'The lighting in this piece is absolutely stunning! How did you achieve that soft glow effect on the clouds?',
    timeAgo: '2 hours ago',
  },
  {
    id: 'comment-2',
    author: {
      name: 'Sarah_Arts',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3Xd_yI9oSoEy454mbLIXKEG-jf7oHOMEumlF6rwwAGIMwydGFodd8k0e6v6ZtfaoKSXx2jVeLw81RuyEco8FLMJdWh61rsWtsoDV3TvauVXU6n0DulrUx8fZ2LDURxFLAgYnrhzplLc5THBpnYdav6rp9Tu2jlF6n-bmDxsy7HmTl7ycwqaqdI-vTo0ksJpqt57PYDgIsFwsBxBP9O8z7Nt8iJO-Mb9iP27pPiTzeCO2-BW_3VUQiOfYi_RTlDxnZLi4hTYUtht4',
    },
    content: 'I love the color palette you chose. The warm oranges against the cool blues create such a beautiful contrast!',
    timeAgo: '5 hours ago',
  },
  {
    id: 'comment-3',
    author: {
      name: 'PixelMaster',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAAQNo_BDZQAC0pFMcFXicMTILS3eox7f_PJZzgrhm2klxWF7MN1r4CZitsLgyeBu4ikwsNcQXaR_LCOOIhUYjg3HubuXgwDifOU9VdVSRsfJOuD4g6uqA_i74KcW4d2C6u1PAErtq-ED573ny-1u6NsPmo5a6WoyUzE8d0mOuwdRsT6DpT0eX4nqdh-qp0fW1zDXfES_zySnb5iBhKFtYJuj8uAEYoBLsLZZsixUocqHtuiVvvtTzQuGIOO5sMZGpKuQbPOSuBANU',
    },
    content: 'This is inspiring! Would love to see a tutorial on your process.',
    timeAgo: '1 day ago',
  },
];

export const mockRelatedArtworks: RelatedArtwork[] = [
  {
    id: 'related-1',
    title: 'Neon City Lights',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCZ_1yETqkrDw1Zyjzqk6Sb2foIYz8SQFnLXfYj6guCdQmj4mSsc-jlCLRhcATTRBCoErsJaaC_ksOL8Ux6t-YK_TlLCa5mVv1riuzVaJv7zKDGoTohr8T46Q0uMC77DGhyaPZqYnwPrrMQv6ehWei91Gwt-DEhzXh5djO0fn5-dH8W3L7Ydh7rnJC38T-ORFGc2D7VxOCKEitaUCoBUNHLY19SvKkgIc9CCyl29ifT5DRY56EvwrfdAsmyRypxpnmp4Yyng7uFKsY',
    artist: 'NeonFlux',
  },
  {
    id: 'related-2',
    title: 'Deep Ocean Mystery',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAEX7NPJ9vkM2764n31kU3vj_WDdw5C0M32qIqrWpnz_AFN6jwtELDZ4JNKcCA_0U6a7MPHK8VMMr-cCbRyOPs6vBued5ybRwWIjUYt2XO8XCQF8rAGBI0kJWJg7_EJN4ti3PVVWScZtW_RPm3lRPmrGX_FUjPqKzKqCt0-NK85dfVT_ewYR56ZzzvsS0FZ0NhEmIT4j695QznSiGrr9AWOvaIS70DdwuuE08VbEs4LsI4wP3PdKVxnoq40sVyqfyt_V_jIGDlFk0I',
    artist: 'DeepBlue',
  },
  {
    id: 'related-3',
    title: 'Morning Peaks',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD-K1qxqklY64vZnc8_FzegVcur0W0cM3wdriVMkyAKmXCpty25Jf7ejP8EHTv49nKmWmRHtE6HnfFk9V2GwuM5hIXn-CYICqEU8BB2oA12-l1i4NCNTFxNZcrP3bnpePKQJIt0PmzWpVUdM0pRkE5arC6FKoF1oDXVAgdcpHNtoKZz_Zdk_qJuy4z5cB5bTR3hNI3YGmtpim5pqjlOAdUwlieOK0e55kc2CW0MtTCWYh8Bn6mmTI33NHW-JbaSvy5ih6J0vFMwqw8',
    artist: 'NatureDraws',
  },
  {
    id: 'related-4',
    title: 'Sector 7 Slums',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCtex54xNFXvBYgp33fXypVc-G06b8FEP69a9GXOKP9toGw7Biq04foXgYs0wU82grQempmfGoYJzjhJB9KJqHk7py64RLYOqEx6i4Jo55oPUiPR4J_V9V67luKukbyr3872KnZjsGMQ9NHzBIKfWFUv6cPOh-k_8rrpZsBPCK2uHndGDAaCI02V07G7Pm78-vO_UtAoEA0UPkmzV6l6BptSIhnrM4dx5mIU-tR-pm91EB0tDcdnCRyE7H6axoD4UFAxwvepwU9Jjw',
    artist: 'MechaFan',
  },
  {
    id: 'related-5',
    title: 'Star Gazer',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCaoekdLylYHwLYaW1F3aLdzu4EUE5zRSmwExc9RK603B2oLodJuGs2LWVEiAfWEpHyTWyZnd_DKG2h0Q3d3ztnLwlz3biQJ9IvaSBCfXBuuwzhzN6PFe__CW03WT6xbi9efFXHLpIKqz8cDcaiwnuQbtz_GUQCLfoW5TWKVdiFlJ78wdQvAGug80RFJ1iDSbSTgpLe3xDncKkSvmad1FHRdxDnc1n-a_XXawm9jgEOtaeirfF9jm1dV0fhhPn3PyiSlFNq-QoX92Q',
    artist: 'AstroPainter',
  },
  {
    id: 'related-6',
    title: 'Crystal Cave',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB8_4oMZvFaSDw8xWct8gLC482yipFvyvvO6azk5m4YyhSlcNFO13I3UlzZFsVlm3tywBJWhNCakYiffl8Gtt-2Oj6IQdfxDSRK0hv-lf31M65ft1EfZqbK269GL8o04Z0YP9Og-NBfbK-HaxoSsxdmSvpGQ49EmplEOVAjBsOIX4zlZD3zgqkFbyIKuHc1w4qwFErLr1wEfsuhAWss9xXK8ZwJmMKsSR87QTnSxuCm2iOZR0NnpdukINno1bWlohBAT8_CkABUpmI',
    artist: 'GemStone',
  },
];

// Helper function to format numbers
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return num.toString();
}
