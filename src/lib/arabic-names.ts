/**
 * Arabic names Saudi shoppers type into Google for games the catalogue lists in English
 * ("فيفا 26" ~6.6k searches/month vs "fc 26 ps5" ~480; OpenSEO keyword data, 2026-11-14).
 * Shown under the product H1, prepended to the <title>, and matched by the store search.
 * Order matters: the first pattern that matches wins (e.g. GTA VI before GTA V).
 * ponytail: hand-kept list of the high-demand titles only; add a row when a new big release lands.
 */
const NAMES: [RegExp, string | ((m: RegExpMatchArray) => string)][] = [
  [/\bFC (\d{2})\b/i, m => `فيفا ${m[1]}`],
  [/Black Ops 7/i, 'بلاك اوبس 7'],
  [/Black Ops 6/i, 'بلاك اوبس 6'],
  [/Black Ops Cold War/i, 'بلاك اوبس كولد وار'],
  [/Grand Theft Auto VI/i, 'قراند 6'],
  [/Grand Theft Auto V\b/i, 'قراند 5'],
  [/Spider-Man 2/i, 'سبايدر مان 2'],
  [/Spider-Man Miles Morales/i, 'سبايدر مان مايلز موراليس'],
  [/Battlefield 6/i, 'باتلفيلد 6'],
  [/Ghost of Y[oō]tei/i, 'قوست اوف يوتي'],
  [/Ghost of Tsushima/i, 'قوست اوف تسوشيما'],
  [/God of War Ragnar/i, 'قود اوف وار راجناروك'],
  [/God of War 2018/i, 'قود اوف وار'],
  [/Red Dead Redemption 2/i, 'ريد ديد ريدمبشن 2'],
  [/Gran Turismo 7/i, 'قران تورزمو 7'],
  [/Mortal Kombat 1\b/i, 'مورتال كومبات 1'],
  [/Mortal Kombat 11/i, 'مورتال كومبات 11'],
  [/Tekken 8/i, 'تيكن 8'],
  [/Elden Ring Nightreign/i, 'الدن رينق نايت رين'],
  [/Elden Ring/i, 'الدن رينق'],
  [/Minecraft/i, 'ماين كرافت'],
  [/It Takes Two/i, 'ات تيكس تو'],
  [/Resident Evil Village/i, 'رزدنت ايفل فيليج'],
  [/Resident Evil (\d)/i, m => `رزدنت ايفل ${m[1]}`],
  [/Assassin's Creed Shadows/i, 'اساسنز كريد شادوز'],
  [/Assassin's Creed Mirage/i, 'اساسنز كريد ميراج'],
  [/Assassin's Creed Valhalla/i, 'اساسنز كريد فالهالا'],
  [/Assassin's Creed/i, 'اساسنز كريد'],
  [/WWE 2K(\d{2})/i, m => `المصارعة WWE 2K${m[1]}`],
  [/Modern Warfare (III|3)\b/i, 'مودرن وارفير 3'],
  [/Modern Warfare (II|2)\b/i, 'مودرن وارفير 2'],
  [/Modern Warfare/i, 'مودرن وارفير'],
  [/Call of Duty/i, 'كول اوف ديوتي'],
  [/Captain Tsubasa/i, 'كابتن ماجد'],
  [/Hogwarts Legacy/i, 'هوقورتس ليقاسي'],
  [/The Last of Us Part II/i, 'ذا لاست اوف اس 2'],
  [/The Last of Us/i, 'ذا لاست اوف اس'],
  [/UNCHARTED/i, 'انشارتد'],
  [/Horizon Forbidden West/i, 'هورايزن فوربيدن ويست'],
  [/Forza Horizon (\d)/i, m => `فورزا هورايزن ${m[1]}`],
  [/Cyberpunk 2077/i, 'سايبر بانك'],
  [/Witcher 3/i, 'ذا ويتشر 3'],
  [/Black Myth Wukong/i, 'بلاك ميث ووكونق'],
  [/Street Fighter 6/i, 'ستريت فايتر 6'],
  [/DRAGON BALL/i, 'دراغون بول'],
  [/NARUTO/i, 'ناروتو'],
  [/Need for Speed/i, 'نيد فور سبيد'],
  [/\bF1 (\d{2})\b/i, m => `فورمولا 1 20${m[1]}`],
  [/NBA 2K(\d{2})/i, m => `ان بي اي 2K${m[1]}`],
  [/UFC\D*(\d)/i, m => `يو اف سي ${m[1]}`],
  [/Crash/i, 'كراش'],
  [/SONIC/i, 'سونيك'],
  [/SpongeBob/i, 'سبونج بوب'],
  [/Batman/i, 'باتمان'],
  [/Mafia/i, 'مافيا'],
  [/FAR CRY/i, 'فار كراي'],
  [/Days Gone/i, 'دايز قون'],
  [/Bloodborne/i, 'بلودبورن'],
  [/Sekiro/i, 'سيكيرو'],
  [/Dying Light/i, 'داينق لايت'],
  [/HITMAN/i, 'هتمان'],
  [/METAL GEAR SOLID/i, 'ميتل قير سوليد'],
  [/SILENT HILL/i, 'سايلنت هيل'],
  [/Monster Hunter/i, 'مونستر هنتر'],
  [/HELLDIVERS 2/i, 'هيلدايفرز 2'],
  [/Split Fiction/i, 'سبليت فيكشن'],
  [/A Way Out/i, 'اي واي اوت'],
  [/Red Dead Redemption/i, 'ريد ديد ريدمبشن'],
];

export function arabicNameOf(name: string): string | null {
  for (const [re, ar] of NAMES) {
    const m = name.match(re);
    if (m) return typeof ar === 'string' ? ar : ar(m);
  }
  return null;
}
