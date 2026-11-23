/** بطاقة صورة لنص (حديث/ذكر) بخلفية داكنة وإطار ذهبي، تُشارَك كملف أو تُنزَّل. بلا صور بشرية. */
export async function shareTextCard(o: { title: string; text: string; source: string; fileName?: string }): Promise<'shared' | 'saved' | 'fail'> {
  try {
    const W = 1080;
    const H = 1350;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d');
    if (!ctx) return 'fail';
    const fam = getComputedStyle(document.body).fontFamily || 'serif';
    try {
      await document.fonts.load(`700 40px ${fam}`, o.text.slice(0, 20));
    } catch {}
    ctx.direction = 'rtl';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#05070d');
    bg.addColorStop(0.6, '#0b0a08');
    bg.addColorStop(1, '#17110a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W / 2, 520, 40, W / 2, 520, 620);
    glow.addColorStop(0, 'rgba(232,194,90,0.2)');
    glow.addColorStop(1, 'rgba(232,194,90,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(232,194,90,0.6)';
    ctx.lineWidth = 3;
    ctx.strokeRect(48, 48, W - 96, H - 96);
    ctx.strokeStyle = 'rgba(232,194,90,0.25)';
    ctx.strokeRect(66, 66, W - 132, H - 132);

    ctx.fillStyle = '#e8c25a';
    ctx.font = `700 46px ${fam}`;
    ctx.fillText(o.title, W / 2, 170);

    // لفّ النص
    let size = 56;
    let lines: string[] = [];
    const maxW = W - 220;
    for (; size >= 32; size -= 4) {
      ctx.font = `400 ${size}px ${fam}`;
      lines = [];
      let cur = '';
      for (const w of o.text.split(/\s+/)) {
        const t = cur ? `${cur} ${w}` : w;
        if (ctx.measureText(t).width > maxW && cur) {
          lines.push(cur);
          cur = w;
        } else cur = t;
      }
      if (cur) lines.push(cur);
      if (lines.length * size * 1.9 < H - 640) break;
    }
    const lh = size * 1.9;
    const y0 = H / 2 - (lines.length * lh) / 2 + lh / 2 - 10;
    ctx.fillStyle = '#fff1c4';
    ctx.font = `400 ${size}px ${fam}`;
    lines.forEach((l, i) => ctx.fillText(l, W / 2, y0 + i * lh));

    ctx.fillStyle = 'rgba(241,215,122,0.85)';
    ctx.font = `400 34px ${fam}`;
    ctx.fillText(o.source, W / 2, H - 230);
    ctx.fillStyle = '#e8c25a';
    ctx.font = `700 40px ${fam}`;
    ctx.fillText('صل على النبي ﷺ', W / 2, H - 140);

    const blob: Blob | null = await new Promise((r) => c.toBlob(r, 'image/png'));
    if (!blob) return 'fail';
    const file = new File([blob], o.fileName || 'card.png', { type: 'image/png' });
    const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean };
    if (nav.share && nav.canShare?.({ files: [file] })) {
      try {
        await nav.share({ files: [file] });
        return 'shared';
      } catch {
        return 'fail';
      }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    return 'saved';
  } catch {
    return 'fail';
  }
}
