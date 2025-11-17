const fs = require("fs");

const PYTHON_BIN = "C:\\Users\\DLCH\\AppData\\Local\\Programs\\Python\\Python311\\python.exe";

console.log("PYTHON_BIN =", PYTHON_BIN);
console.log("existsSync =", fs.existsSync(PYTHON_BIN));
