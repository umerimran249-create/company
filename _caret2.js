const { spawnSync } = require("child_process");
const fs = require("fs");
const vm = require("vm");

const files = [
  "C:/Users/Computer House/Desktop/company/site/_next/static/chunks/308-2964a44ecd2e9ecc.js",
  "C:/Users/Computer House/Desktop/company/site/_next/static/chunks/app/about/page-66e9e19f431e5e7e.js",
  "C:/Users/Computer House/Desktop/company/site/_next/static/chunks/app/contact/page-9386f4bed7e050b9.js",
];

for (const file of files) {
  const r = spawnSync(process.execPath, ["--check", file], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
  const text = (r.stderr || "") + (r.stdout || "");
  const lines = text.split(/\n/);
  console.log("\nFILE", file.split("/").slice(-2).join("/"), "lines", lines.length, "status", r.status);
  lines.forEach((line, i) => {
    const caret = line.indexOf("^");
    if (caret >= 0 && line.trim() === "^") {
      console.log("caret line", i + 1, "col", caret, "prevLen", (lines[i - 1] || "").length);
      const prev = lines[i - 1] || "";
      console.log("prev tail", JSON.stringify(prev.slice(Math.max(0, caret - 80), caret + 40)));
    }
  });
  const hit = lines.find((l) => l.includes("SyntaxError"));
  console.log("stderrHead", JSON.stringify(text.slice(0, 180)));
  console.log(hit);
  const code = fs.readFileSync(file, "utf8");
  try {
    new vm.Script(code, { filename: "chunk.js" });
    console.log("vm ok", code.length);
  } catch (e) {
    console.log("vm", e.message);
    console.log(String(e.stack).split("\n").slice(0, 4).join(" | "));
  }
}
