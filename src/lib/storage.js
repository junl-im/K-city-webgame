const PREFIX = "kcity.innerworld";

export function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(`${PREFIX}.${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.warn("localStorage read failed", error);
    return fallback;
  }
}

export function writeJSON(key, value) {
  try {
    localStorage.setItem(`${PREFIX}.${key}`, JSON.stringify(value));
  } catch (error) {
    console.warn("localStorage write failed", error);
  }
}

export function removeJSON(key) {
  localStorage.removeItem(`${PREFIX}.${key}`);
}
