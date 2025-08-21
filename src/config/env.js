export function readEnvBool(key, defaultVal = false) {
  const v = process.env[key];
  if (v === undefined) return defaultVal;
  return String(v).toLowerCase() === 'true';
}

export function readEnvNum(key, defaultVal) {
  const v = process.env[key];
  const n = Number(v);
  return Number.isFinite(n) ? n : defaultVal;
}
