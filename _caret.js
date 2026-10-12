const fs = require("fs");
const path = "C:/Users/Computer House/AppData/Local/Temp/jserr-308.txt";
const text = fs.readFileSync(path, "utf8");
const lines = text.split(/\r?\n/);
lines.forEach((line, i) => {
  if (line.includes("^") || line.trim() === "" || line.includes("SyntaxError")) {
    const caret = line.indexOf("^");
    console.log(i + 1, "len", line.length, "caret", caret, JSON.stringify(line.slice(0, 40)), "end", JSON.stringify(line.slice(-20)));
  }
});
