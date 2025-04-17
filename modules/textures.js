const child_process = require('child_process');
const fs = require('fs');

fs.mkdirSync("./output/Textures");
child_process.execFileSync("utils\\umodel.exe", [ "-path=.\\extract\\MLP", "-export", "-out=.\\output\\Textures", "-png", "-nomesh", "-noanim", "-nostat", "-novert", "-nomorph", "-nolightmap", "-game=ue4.27", "*" ], { stdio: "inherit" });