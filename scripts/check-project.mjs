import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "index.html",
  "src/main.js",
  "src/lib/firebase.js",
  "src/ui/app.js",
  "src/game/battle.js",
  "firestore.rules"
];

let ok = true;
for (const file of required) {
  const exists = fs.existsSync(path.join(root, file));
  console.log(`${exists ? "OK" : "MISS"} ${file}`);
  ok = ok && exists;
}
process.exit(ok ? 0 : 1);
