export function toDisplay(player) {
  const t = player?.track || player?.queue?.[0];
  if (!t) return null;
  return {
    title: t.info?.title,
    author: t.info?.author,
    duration: formatMs(t.info?.length),
    url: t.info?.uri
  };
}

export function formatMs(ms) {
  if (!ms || ms < 0) return 'Live';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}` : `${m}:${String(ss).padStart(2, '0')}`;
}
