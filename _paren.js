const fs = require("fs");
const files = [
  "site/_next/static/chunks/308-2964a44ecd2e9ecc.js",
  "site/_next/static/chunks/app/about/page-66e9e19f431e5e7e.js",
  "site/_next/static/chunks/app/contact/page-9386f4bed7e050b9.js",
];
const root = "C:/Users/Computer House/Desktop/company/";

function scan(s) {
  let depth = 0;
  let brace = 0;
  let bracket = 0;
  let str = null;
  let esc = false;
  let min = 0;
  let minAt = 0;
  const neg = [];
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (str) {
      if (esc) {
        esc = false;
        continue;
      }
      if (c === "\\") {
        esc = true;
        continue;
      }
      if (c === str) str = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      str = c;
      continue;
    }
    if (c === "(") depth++;
    else if (c === ")") {
      depth--;
      if (depth < min) {
        min = depth;
        minAt = i;
      }
      if (depth < 0 && neg.length < 6) neg.push(i);
    } else if (c === "{") brace++;
    else if (c === "}") brace--;
    else if (c === "[") bracket++;
    else if (c === "]") bracket--;
  }
  return { depth, brace, bracket, min, minAt, neg, unterminated: str };
}

for (const f of files) {
  const s = fs.readFileSync(root + f, "utf8");
  const r = scan(s);
  console.log("\n==", f);
  console.log(r);
  console.log("tail", JSON.stringify(s.slice(-220)));
  const at = r.neg[0] != null ? r.neg[0] : r.minAt;
  if (at) console.log("around", JSON.stringify(s.slice(Math.max(0, at - 160), at + 80)));
}
