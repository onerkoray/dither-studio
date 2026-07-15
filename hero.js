/*!
 * Dither Studio — hero arka planı
 * Aracın kendi ordered (Bayer 8×8) dithering'ini kullanan, yavaş
 * animasyonlu duotone gradyan. Nous portalı estetiğinde.
 * © Koray Öner — MIT
 */
(function () {
  "use strict";
  const canvas = document.getElementById("heroDither");
  if (!canvas) return;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  // duotone palet (site paletiyle uyumlu)
  const FG = [232, 228, 216]; // bone
  const BG = [10, 10, 10];    // near black

  // 8×8 Bayer eşik matrisi
  const BAYER = [
    [0,32,8,40,2,34,10,42],[48,16,56,24,50,18,58,26],
    [12,44,4,36,14,46,6,38],[60,28,52,20,62,30,54,22],
    [3,35,11,43,1,33,9,41],[51,19,59,27,49,17,57,25],
    [15,47,7,39,13,45,5,37],[63,31,55,23,61,29,53,21],
  ];

  const SCALE = 3; // düşük çözünürlük → pikselleştirilmiş
  let W = 0, H = 0, t = 0, raf = 0, reduced = false;

  function resize() {
    const r = canvas.getBoundingClientRect();
    W = Math.max(1, Math.ceil(r.width / SCALE));
    H = Math.max(1, Math.ceil(r.height / SCALE));
    canvas.width = W;
    canvas.height = H;
  }

  function frame() {
    const img = ctx.createImageData(W, H);
    const d = img.data;
    const cx = W * (0.5 + 0.18 * Math.sin(t * 0.6));
    const cy = H * (0.42 + 0.12 * Math.cos(t * 0.45));
    const maxD = Math.hypot(W, H) * 0.62;

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        // hareketli radyal gradyan + hafif dalga → sürekli tonlama
        const dist = Math.hypot(x - cx, y - cy) / maxD;
        let v = 1 - dist;
        v += 0.10 * Math.sin(x * 0.06 + t * 1.3);
        v += 0.08 * Math.sin(y * 0.05 - t * 1.1);
        v = Math.max(0, Math.min(1, v * 1.15 - 0.12));

        // Bayer ordered dithering ile 1-bit'e indir
        const th = (BAYER[y & 7][x & 7] + 0.5) / 64;
        const on = v > th;
        const i = (y * W + x) * 4;
        const c = on ? FG : BG;
        d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function loop() {
    t += 0.008;
    frame();
    raf = requestAnimationFrame(loop);
  }

  function start() {
    resize();
    reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { frame(); }        // tek kare — animasyon yok
    else { cancelAnimationFrame(raf); loop(); }
  }

  let rt;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(start, 150); });
  // görünür değilken animasyonu durdur (pil/CPU dostu)
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else if (!reduced) loop();
  });

  start();
})();
