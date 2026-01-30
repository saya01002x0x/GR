// Types
export type FeaturedItem = {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  tag: { label: string; color: string };
};

export type RankingArtwork = {
  id: string;
  title: string;
  artist: string;
  image: string;
  rank: number;
};

export type DiscoverArtwork = {
  id: string;
  title: string;
  artist: { name: string; avatar: string };
  image: string;
  liked?: boolean;
};

export type RisingStar = {
  id: string;
  name: string;
  avatar: string;
  followers: string;
};

export type FeaturedArtworkData = {
  id: string;
  title: string;
  artist: { name: string; avatar: string };
  image: string;
  description: string;
};

// Mock Data
export const featuredItems: FeaturedItem[] = [
  {
    id: '1',
    title: 'The Art of Summer 2024',
    subtitle: 'Dive into our curated collection of sun-soaked illustrations and beachside stories from top creators.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB86SjSzS-HT-Jxr5OT9M2ZpM9S5aX7jTePABUMLlgxKDs-JqvbMLRvLx3KY4lGmjUhCjMEUK5Tgw-V9sB693CpMtpEDR-oOuaMMZFg7z8s6HcaGpAMHpepXAM5ZywfF5VW4HQHd8xrSNUTFzVXBANT0q_W_X9CV4TBHG3pMZJQl_IuDFtNF6244oNRVA_sHX5aHzQKo2yasv-ILfOjxCcyUk26F18Qp9thWPP60Zv_RCdQH407r951Ksv-SXU4yk4ic4l40EAL0nI',
    tag: { label: 'Spotlight', color: 'primary' },
  },
  {
    id: '2',
    title: 'Fantasy Worlds',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAxGEdWNMSyS8fjOB6a_3IleuN86Sfy0kB7lOrpPzasIc1-4mQitBRl6iKZDBiOLs8beFxe5WiWPyciulaudqdzF8nCAm0xL-unaGZPMdlmf9XXQ7xEWDF187Q32Kq18Ikktw3vn80cf0AHa13Kxdg9vMKEdKsUbq4jMsxrZlqXjgq1u5CcQqxYGFNLeVO7A-pI7ToXETBpgyOjIDreUK0cFj9tZHdBHkhL-7b-tTI4MztPJmTPdLXrCp60Vq3lj-UBiXNqnrOABEo',
    tag: { label: 'Staff Pick', color: 'primary' },
  },
  {
    id: '3',
    title: 'Mastering Lighting',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBjRdUE99QmjzK7XnU-6ssZkwFmttS7sm9zDFY8upgJIpF-SN7QIc2jNIzAxPQOTHq91t_x6HrTcFJEOP4z9c-QZNONkduevSFeuvSR9gm24RyLIpTz4om1MrpqvaO-GHC220h2RWH6__vzGELtqMjdwfZC7s6BNNanqj4vzSWxlg537z68KtiO32bJQq0aiK0w0HQtaQnQY9TnwlSqHW4QK5y4q2pvrW1JBGS7irjStH0T5AzJbTsgOaQ1ydqzP4isCcdUF5fHhFE',
    tag: { label: 'Tutorial', color: 'blue' },
  },
];

export const categories = [
  { id: 'all', label: 'All', active: true },
  { id: 'original', label: 'Original', active: false },
  { id: 'fanart', label: 'Fan Art', active: false },
  { id: 'scenery', label: 'Scenery', active: false },
  { id: 'manga', label: 'Manga', active: false },
  { id: 'ai', label: 'AI-Generated', active: false },
  { id: 'sketch', label: 'Sketch', active: false },
  { id: 'watercolor', label: 'Watercolor', active: false },
];

export const rankingTabs = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'rookie', label: 'Rookie' },
];

export const rankingArtworks: RankingArtwork[] = [
  {
    id: '1',
    title: 'Golden Era',
    artist: 'ArtMaster99',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCFzJb0DBgyOl8ZG3WYknCKRtF0ntWNpq-25DIHWzwd2_yLUDXgrn7_wTg4CAo5B8deJnO1H79a3Yn64uUCCcXkqjtP0Z_b_3aHypTaJPM8BAOBte2TsIHXaPaiiuEG9Tg3RhXJtz1__YDwz4LWD0rwcuCrVh8PUFfUOCzSZcQAF31Nz-IVLcGY6gN-UFNJrycvQjZkTg0r1OspEaM4S8Yhld6wz5HrL6r-sRK4vYY-Eo1Kg6AlYEMASaIu3n2qckXdU66cyhl9Ub8',
    rank: 1,
  },
  {
    id: '2',
    title: 'Neon Dreams',
    artist: 'NeonFlux',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCZ_1yETqkrDw1Zyjzqk6Sb2foIYz8SQFnLXfYj6guCdQmj4mSsc-jlCLRhcATTRBCoErsJaaC_ksOL8Ux6t-YK_TlLCa5mVv1riuzVaJv7zKDGoTohr8T46Q0uMC77DGhyaPZqYnwPrrMQv6ehWei91Gwt-DEhzXh5djO0fn5-dH8W3L7Ydh7rnJC38T-ORFGc2D7VxOCKEitaUCoBUNHLY19SvKkgIc9CCyl29ifT5DRY56EvwrfdAsmyRypxpnmp4Yyng7uFKsY',
    rank: 2,
  },
  {
    id: '3',
    title: 'Spirit of Woods',
    artist: 'NatureDraws',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD-K1qxqklY64vZnc8_FzegVcur0W0cM3wdriVMkyAKmXCpty25Jf7ejP8EHTv49nKmWmRHtE6HnfFk9V2GwuM5hIXn-CYICqEU8BB2oA12-l1i4NCNTFxNZcrP3bnpePKQJIt0PmzWpVUdM0pRkE5arC6FKoF1oDXVAgdcpHNtoKZz_Zdk_qJuy4z5cB5bTR3hNI3YGmtpim5pqjlOAdUwlieOK0e55kc2CW0MtTCWYh8Bn6mmTI33NHW-JbaSvy5ih6J0vFMwqw8',
    rank: 3,
  },
  {
    id: '4',
    title: 'Unit-01',
    artist: 'MechaFan',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCtex54xNFXvBYgp33fXypVc-G06b8FEP69a9GXOKP9toGw7Biq04foXgYs0wU82grQempmfGoYJzjhJB9KJqHk7py64RLYOqEx6i4Jo55oPUiPR4J_V9V67luKukbyr3872KnZjsGMQ9NHzBIKfWFUv6cPOh-k_8rrpZsBPCK2uHndGDAaCI02V07G7Pm78-vO_UtAoEA0UPkmzV6l6BptSIhnrM4dx5mIU-tR-pm91EB0tDcdnCRyE7H6axoD4UFAxwvepwU9Jjw',
    rank: 4,
  },
];

export const featuredArtwork: FeaturedArtworkData = {
  id: 'featured-1',
  title: 'Skybound Citadel',
  artist: {
    name: 'AetherPainter',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAUH2Pv0nmH96-AQboIMJzXbIDWGYNJbFLqb_rtVPZUv4DoTeN2bfRRdv4O_kkfUR_mnqiSuNyfiXbmf4sE7duS-mF0XXBIKPDmAA9fLU975bFYZ5x9x9bGUQ0LQqaFbajgx5f2BnmOlDZp1VLLlD1z3Ua2zXamGjcYFffXqoPoqKaezC6TcGzlWyTjUUUTn2ppnK9zR8AlAPaZuzvPNjbYsTzh78FZUCj8daqqx4QqSWrLu6Gle_cfdh0TFIxh9Dc-akVMMTd3aJE',
  },
  image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCsWkKepOvaAsT5c8o-VVWPirAjqRsQPdRH-t15QqWcR1Ls7EdJusyrGTM8Apf-i2Q2STy8OSgcPqv34I7M-Ozb_EdFeSLAPOpJ9ZLV6DPdlAw5B34fJBiRJO77DCif84sNRBCaVmVNGzNyc60SsLQlIb0RbpclTfkKLR4cChnQu1_XiKKBjhqwLUHKBLbPOXLpg83k2tfIuE0VmKbBWTI-pTVFdo8GZLN2x_Hravd72HKW1a2K2rrUbrNmd88RMN-EXUO-reILEGQ',
  description: 'Experience the breathtaking beauty of a civilization suspended among the clouds. This piece explores the delicate balance between nature and advanced architecture in a high-fantasy setting.',
};

export const discoverArtworks: DiscoverArtwork[] = [
  {
    id: 'd1',
    title: 'Starlight Guardian',
    artist: { name: 'HoshiArt', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAjk9qh1MThIXjnvZ_JGjRqKKG85Ug2k3mS3DFXKOIhVnItfF4ND530Ct8bxZSn-DAavLLkOXgpJl7POHIg9Lp6wWNLhPKJDdFKuV-6Q7OVP5oy6l_avSQxTznHRmW86GdcG-M5mohs36gQSCy7VMSLHpEjHs3xCVP7WkYltDDFdILsueXhsuPjqsKlFsCZ080a5LiFbDbJqjZMrerzbEpcdHUuiN1jkM5wAhTe1jMA8wZr-FOOXQli3gO6jLzcx3XtpQUX4Efg4JI' },
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAwRDFqVb4JhMRthzCbXfnzFtSvBRVwKpsxeW4rOIqa8WFr73Ta24gW4mz_ZLiQ-jggGYnmhhugWNRkNNHIL4H88trHZRylc8U8mZ1JIidGjEKwhGuST7iFmx7tsG1VhVzLyZcC0k41r7TZ4sdg12cfZN7YH2ZAy2o4AvvlndtIbOyvxv5mMRfN5DTe5h7CQSNFhx5u9mCYwO81XpxLVpPJlsNmIUHzzN9bOMOxQBmnzyNBzohOibGI_HiD07jQvgS0AUsbaBOnRQI',
    liked: true,
  },
  {
    id: 'd2',
    title: 'Tokyo Twilight',
    artist: { name: 'CityScaper', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3Xd_yI9oSoEy454mbLIXKEG-jf7oHOMEumlF6rwwAGIMwydGFodd8k0e6v6ZtfaoKSXx2jVeLw81RuyEco8FLMJdWh61rsWtsoDV3TvauVXU6n0DulrUx8fZ2LDURxFLAgYnrhzplLc5THBpnYdav6rp9Tu2jlF6n-bmDxsy7HmTl7ycwqaqdI-vTo0ksJpqt57PYDgIsFwsBxBP9O8z7Nt8iJO-Mb9iP27pPiTzeCO2-BW_3VUQiOfYi_RTlDxnZLi4hTYUtht4' },
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCP6V66ykQgZU92PwEjJTcdcNWZmE3QBaN_CSXOD3dvwgvpmcEO_jDBDt2NrwOh3h4gkrpRW6yM3Pu9dt6e92NbM_5ZWLB5Orhpwi4u68phzGkfutLnLho62oUY1tifKUU53m19y50cTH0ruhLfBcq5ICIY6xjO7ROeIXfc7lBop1Dt0gfsQVRinhSunmWoTVxYhHnDOWAftv57xOVqu3udU85pTpdD8AreQFoeGKbuXwIR86x0tez6gPiGZSdGLKkBUaVes55VDfU',
  },
  {
    id: 'd3',
    title: 'Leviathan',
    artist: { name: 'DeepBlue', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAAQNo_BDZQAC0pFMcFXicMTILS3eox7f_PJZzgrhm2klxWF7MN1r4CZitsLgyeBu4ikwsNcQXaR_LCOOIhUYjg3HubuXgwDifOU9VdVSRsfJOuD4g6uqA_i74KcW4d2C6u1PAErtq-ED573ny-1u6NsPmo5a6WoyUzE8d0mOuwdRsT6DpT0eX4nqdh-qp0fW1zDXfES_zySnb5iBhKFtYJuj8uAEYoBLsLZZsixUocqHtuiVvvtTzQuGIOO5sMZGpKuQbPOSuBANU' },
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAEX7NPJ9vkM2764n31kU3vj_WDdw5C0M32qIqrWpnz_AFN6jwtELDZ4JNKcCA_0U6a7MPHK8VMMr-cCbRyOPs6vBued5ybRwWIjUYt2XO8XCQF8rAGBI0kJWJg7_EJN4ti3PVVWScZtW_RPm3lRPmrGX_FUjPqKzKqCt0-NK85dfVT_ewYR56ZzzvsS0FZ0NhEmIT4j695QznSiGrr9AWOvaIS70DdwuuE08VbEs4LsI4wP3PdKVxnoq40sVyqfyt_V_jIGDlFk0I',
  },
  {
    id: 'd4',
    title: 'Zen Protocol',
    artist: { name: 'RoboArtist', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCeVt499E4dekn8aAEDg3rw0zV6lcPyDfKfj3lnhwSp-ttR4bPYKWC1o-v-B4sOX4FbXZtlMpTf_TpsWQtb93pdxyGKXvpnv0ohG6k11CdJ-3b4zH94VWcJORR66iVsJpxfdnu4-0os87Y5nBc4o1Vo8b3j6rgKlG4Sli8wsz8iQwLwQuGfDFt-efzvgQAuKVnHJPDkVI7FNmq89chmGvhhGxxz0QTG5wfjl_OkYZ7YB15lHbjJ56NkrjiJ_Lh-DThtRrHjQjO5UrQ' },
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBSW6yED2VwytyMc0TBnUnztxrNQCW-EnTcR3ISsb6-Kq1hVB4ywhH9VE26PXLWKtMFaR_EYL9_iDGQI_yPkfbB7RrEe85wkk0Ass50WfhC38FGQKEgi9xjsckwFrOzXuzbTkXMND5qKphJgXM5D46td8GdvMaZ0rrX8gPnUPW31d9vaDpnwTQT-xu8MVvXHP4k0f435en1abb9ctuUPbPTVU_3FzEdE0w7zfVDrtzypuAtwG9IfwDBLJuYOGLcYhupujZL5rNJZNw',
  },
  {
    id: 'd5',
    title: 'October Morning',
    artist: { name: 'SeasonalArt', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDh9Sy3fDtRteXNoP2fgpk5yOUrCOl2DK-oKA6JLZ6h2EW53ULJZ_8DRNFXCN4EuZWAMfeCcgOIGBbhHiOacGXDPW_xUm2hZLVtF61y41oqQuEo9zx8Rp1Cpy5H0FvwqtjyeubBIANos3Gu2Uzl5wkD_SkZt4-JC56keYj_GBFs99hnqbMJ9ozksE2SirPqaOQDaXcQsDk8z0lbvV5LZJvmbD_RdBgRNwY8gYzpRsne0ojTJuIWT6R5p84eLCKI_rG8xPs3LvB_zyw' },
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB8_4oMZvFaSDw8xWct8gLC482yipFvyvvO6azk5m4YyhSlcNFO13I3UlzZFsVlm3tywBJWhNCakYiffl8Gtt-2Oj6IQdfxDSRK0hv-lf31M65ft1EfZqbK269GL8o04Z0YP9Og-NBfbK-HaxoSsxdmSvpGQ49EmplEOVAjBsOIX4zlZD3zgqkFbyIKuHc1w4qwFErLr1wEfsuhAWss9xXK8ZwJmMKsSR87QTnSxuCm2iOZR0NnpdukINno1bWlohBAT8_CkABUpmI',
  },
  {
    id: 'd6',
    title: 'Lost in Void',
    artist: { name: 'AstroPainter', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBOLw54o5zq_VyD2HjjA13bbsUFzKcKf5KbDIgMOz-tBexcSGkm21ZsAIHl_eixdCPOXsWTOvmSI1dbEw3koezYpxaMWBGxnjX0Nuc9sSnXnaTv32Qy8UBDkX5AMu-Sl7H53UfHtlkJq75SOl1whDufZbxpdO1J_QUHIk1-Agvfx7HuUhJglulpVuUQjGBmfLC3Bmp5xUmlDc86mPBghjGNHRFcu8ffli4QZILvvOYduFWFFlN3AAVFdUGIQhM4qXqUSVxbaNd-rzA' },
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCaoekdLylYHwLYaW1F3aLdzu4EUE5zRSmwExc9RK603B2oLodJuGs2LWVEiAfWEpHyTWyZnd_DKG2h0Q3d3ztnLwlz3biQJ9IvaSBCfXBuuwzhzN6PFe__CW03WT6xbi9efFXHLpIKqz8cDcaiwnuQbtz_GUQCLfoW5TWKVdiFlJ78wdQvAGug80RFJ1iDSbSTgpLe3xDncKkSvmad1FHRdxDnc1n-a_XXawm9jgEOtaeirfF9jm1dV0fhhPn3PyiSlFNq-QoX92Q',
  },
];

export const risingStars: RisingStar[] = [
  {
    id: 'rs1',
    name: 'SakuraDev',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAxQOVJSpSRDA2gRFg73dmTYjzmsw-gcDjw05jBwxfW_cgLVCPjga0IWp_PE6LFz0J03kKF-xp4J4B5uXIpaBsStpzJPVDrWTrIXr0sIIW5kiaBt9aWierKp88u1S9n3gziovOBzUrCi2zvq7v2ab-Wn7AzUaAQUJ3NoK1qIFQvn8DFdSFE51WNJWW-TQbz0j93cCJ_tbGs2n7T0EVEtbsdJpH2qrbFk0qSI0spBw-rx1Wq_-R0AjyFwGpcUqjE5EsPL4_tMwIgyDU',
    followers: '12k',
  },
  {
    id: 'rs2',
    name: 'BluePencil',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAUH2Pv0nmH96-AQboIMJzXbIDWGYNJbFLqb_rtVPZUv4DoTeN2bfRRdv4O_kkfUR_mnqiSuNyfiXbmf4sE7duS-mF0XXBIKPDmAA9fLU975bFYZ5x9x9bGUQ0LQqaFbajgx5f2BnmOlDZp1VLLlD1z3Ua2zXamGjcYFffXqoPoqKaezC6TcGzlWyTjUUUTn2ppnK9zR8AlAPaZuzvPNjbYsTzh78FZUCj8daqqx4QqSWrLu6Gle_cfdh0TFIxh9Dc-akVMMTd3aJE',
    followers: '8.5k',
  },
  {
    id: 'rs3',
    name: 'InkFlow',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB8FdK8LbZKj9grAFmKt4s026lkHVAgkrav28Qn1KGxlmmXOIilkUGzVQWQCp8pcacwXbkkQgPDoT8m97HtqS17_UsDneFO2RjHcySznYj2ul2INIgczDlQ_4Rzrf7BVuZeDI-dQA94NJ_nB9RsDtSikPbA-WwpuDlVUHL4gLC8C5M0GQekoXqwvYSgDUGNkOfzxufa-n6TtEkX7qirSALLOeEuPe1XJ7L_k_xdALICmdKiaQOLpo8-p8lBaD9d_key3mDihssp8fQ',
    followers: '5k',
  },
];

export const popularTags = [
  '#Cyberpunk',
  '#GenshinImpact',
  '#DigitalArt',
  '#Anime',
  '#Landscape',
];
