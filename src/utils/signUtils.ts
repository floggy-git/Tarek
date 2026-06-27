/**
 * Utility for rendering authentic, high-quality Dutch and European traffic signs
 * by fetching verified vector (SVG) images from Wikimedia Commons.
 */

// A simple standard implementation of the MD5 hashing algorithm in TypeScript
// used to calculate the path directories for Wikimedia Commons files.
export function md5(str: string): string {
  function md5cycle(x: number[], k: number[]) {
    let a = x[0], b = x[1], c = x[2], d = x[3];

    a = ff(a, b, c, d, k[0], 7, -680876936);
    d = ff(d, a, b, c, k[1], 12, -389564586);
    c = ff(c, d, a, b, k[2], 17,  606105819);
    b = ff(b, c, d, a, k[3], 22, -1044525330);
    a = ff(a, b, c, d, k[4], 7, -176418897);
    d = ff(d, a, b, c, k[5], 12,  1200080426);
    c = ff(c, d, a, b, k[6], 17, -1473231341);
    b = ff(b, c, d, a, k[7], 22, -45705983);
    a = ff(a, b, c, d, k[8], 7,  1770035416);
    d = ff(d, a, b, c, k[9], 12, -1958414417);
    c = ff(c, d, a, b, k[10], 17, -42063);
    b = ff(b, c, d, a, k[11], 22, -1990404162);
    a = ff(a, b, c, d, k[12], 7,  1804603682);
    d = ff(d, a, b, c, k[13], 12, -40341101);
    c = ff(c, d, a, b, k[14], 17, -1502002290);
    b = ff(b, c, d, a, k[15], 22,  1236535329);

    a = gg(a, b, c, d, k[1], 5, -165796510);
    d = gg(d, a, b, c, k[6], 9, -1069501632);
    c = gg(c, d, a, b, k[11], 14,  643717713);
    b = gg(b, c, d, a, k[0], 20, -373897302);
    a = gg(a, b, c, d, k[5], 5, -701558691);
    d = gg(d, a, b, c, k[10], 9,  38016083);
    c = gg(c, d, a, b, k[15], 14, -660478335);
    b = gg(b, c, d, a, k[4], 20, -405537848);
    a = gg(a, b, c, d, k[9], 5,  568446438);
    d = gg(d, a, b, c, k[14], 9, -1019803690);
    c = gg(c, d, a, b, k[3], 14, -187363961);
    b = gg(b, c, d, a, k[8], 20,  1163531501);
    a = gg(a, b, c, d, k[13], 5, -1444681467);
    d = gg(d, a, b, c, k[2], 9, -51403784);
    c = gg(c, d, a, b, k[7], 14,  1735328473);
    b = gg(b, c, d, a, k[12], 20, -1926607734);

    a = hh(a, b, c, d, k[5], 4, -378558);
    d = hh(d, a, b, c, k[8], 11, -2022574463);
    c = hh(c, d, a, b, k[11], 16,  1839030562);
    b = hh(b, c, d, a, k[14], 23, -35309556);
    a = hh(a, b, c, d, k[1], 4, -1530992060);
    d = hh(d, a, b, c, k[4], 11,  1272893353);
    c = hh(c, d, a, b, k[7], 16, -155497632);
    b = hh(b, c, d, a, k[10], 23, -1094730640);
    a = hh(a, b, c, d, k[13], 4,  681279174);
    d = hh(d, a, b, c, k[0], 11, -358537222);
    c = hh(c, d, a, b, k[3], 16, -722521979);
    b = hh(b, c, d, a, k[6], 23,  76029189);
    a = hh(a, b, c, d, k[9], 4, -640364487);
    d = hh(d, a, b, c, k[12], 11, -421815835);
    c = hh(c, d, a, b, k[15], 16,  530742520);
    b = hh(b, c, d, a, k[2], 23, -995338651);

    a = ii(a, b, c, d, k[0], 6, -198630844);
    d = ii(d, a, b, c, k[7], 10,  1126891415);
    c = ii(c, d, a, b, k[14], 15, -1416354905);
    b = ii(b, c, d, a, k[5], 21, -57434055);
    a = ii(a, b, c, d, k[12], 6,  1700485571);
    d = ii(d, a, b, c, k[3], 10, -1894986606);
    c = ii(c, d, a, b, k[10], 15, -1051523);
    b = ii(b, c, d, a, k[1], 21, -2054922799);
    a = ii(a, b, c, d, k[8], 6,  1873313359);
    d = ii(d, a, b, c, k[15], 10, -30611744);
    c = ii(c, d, a, b, k[6], 15, -1560198380);
    b = ii(b, c, d, a, k[13], 21,  1309151649);
    a = ii(a, b, c, d, k[4], 6, -145523070);
    d = ii(d, a, b, c, k[11], 10, -1120210379);
    c = ii(c, d, a, b, k[2], 15,  718787259);
    b = ii(b, c, d, a, k[9], 21, -343485551);

    x[0] = add32(a, x[0]);
    x[1] = add32(b, x[1]);
    x[2] = add32(c, x[2]);
    x[3] = add32(d, x[3]);
  }

  function cmn(q: number, a: number, b: number, x: number, s: number, t: number) {
    return add32(circularShiftLeft(add32(add32(a, q), add32(x, t)), s), b);
  }

  function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn((b & c) | (~b & d), a, b, x, s, t);
  }

  function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn((b & d) | (c & ~d), a, b, x, s, t);
  }

  function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn(b ^ c ^ d, a, b, x, s, t);
  }

  function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn(c ^ (b | ~d), a, b, x, s, t);
  }

  function add32(x: number, y: number) {
    return (x + y) & 0xFFFFFFFF;
  }

  function circularShiftLeft(num: number, cnt: number) {
    return (num << cnt) | (num >>> (32 - cnt));
  }

  function md5tohex(state: number[]) {
    let hex_tab = '0123456789abcdef';
    let output = '';
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        let byte = (state[i] >>> (j * 8)) & 0xFF;
        output += hex_tab.charAt((byte >>> 4) & 0x0F) + hex_tab.charAt(byte & 0x0F);
      }
    }
    return output;
  }

  let n = str.length,
    state = [1732584193, -271733879, -1732584194, 271733878],
    i;
  
  let words: number[] = [];
  for (i = 0; i < n; i++) {
    words[i >>> 2] |= str.charCodeAt(i) << ((i & 3) * 8);
  }
  words[n >>> 2] |= 0x80 << ((n & 3) * 8);
  
  let len_words = ((n + 8) >>> 6) * 16 + 14;
  while (words.length <= len_words) {
    words.push(0);
  }
  words[len_words] = n * 8;

  for (i = 0; i < words.length; i += 16) {
    md5cycle(state, words.slice(i, i + 16));
  }
  return md5tohex(state);
}

// Special overrides for signs where the filename does not match 'Nederlands_verkeersbord_<CODE>.svg' exactly
const FILENAME_OVERRIDES: Record<string, string> = {
  'A1-15': 'Nederlands_verkeersbord_A1-15sb.svg',
  'A1-30': 'Nederlands_verkeersbord_A1-30.svg',
  'A1-50': 'Nederlands_verkeersbord_A1-50.svg',
  'A1-60': 'Nederlands_verkeersbord_A1-60.svg',
  'A1-70': 'Nederlands_verkeersbord_A1-70.svg',
  'A1-80': 'Nederlands_verkeersbord_A1-80.svg',
  'A1-90': 'Nederlands_verkeersbord_A1-90.svg',
  'A1-100': 'Nederlands_verkeersbord_A1-100.svg',
  'A1-120': 'Nederlands_verkeersbord_A1-120.svg',
  'A1-130': 'Nederlands_verkeersbord_A1-130.svg',
  'A2': 'Nederlands_verkeersbord_A2.svg',
  'A2-30': 'Nederlands_verkeersbord_A2-30.svg',
  'A2-50': 'Nederlands_verkeersbord_A2-50.svg',
  'E8-Permit': 'Nederlands_verkeersbord_E8.svg',
};

/**
 * Builds the authentic Wikimedia Commons URL for a given Dutch sign code.
 * It uses Wikipedia's Special:FilePath which is the most reliable redirect service.
 * It handles the mapping to upload.wikimedia.org automatically and handles caching.
 * We specify width to get a fast, pre-rendered PNG from Wikimedia's server, which avoids any local SVG rendering bugs.
 */
export function getDutchSignUrl(code: string): string {
  const filename = FILENAME_OVERRIDES[code] || `Nederlands_verkeersbord_${code}.svg`;
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${filename}?width=160`;
}
