const fs = require('fs');
const crypto = require('fs');
const os = require('os');
const child_process = require('child_process');

if (os.platform() !== "win32" || (os.arch() !== "x64" && os.arch() !== "arm64")) {
    console.log("Sorry, this program depends on utilities that are only available on 64bit Windows. Please run this program on a device running a 64bit version of Windows and try again.");
    process.exit(2);
}

if (!fs.existsSync("./game.pak")) {
    console.log("Game data not found. Please copy the game .pak file to 'game.pak' in the current directory and try again.");
    process.exit(2);
}

let needExtract = true;
let hash;

if (!process.argv.includes("-check")) {
    console.log("Game data is " + fs.lstatSync("./game.pak").size + " bytes, computing MD5 checksum... This may take a few minutes, please be patient. You can also pass -check to the command line to disable checking for changes.");
    hash = require('child_process').execSync("powershell \"Get-FileHash game.pak -Algorithm MD5 | Select-Object -ExpandProperty Hash\"").toString().trim();

    console.log("MD5 checksum is " + hash);

    if (fs.existsSync("extract")) {
        if (fs.existsSync("extract/_MD5") && fs.existsSync("extract/_Success") && fs.readFileSync("extract/_MD5").toString().trim() === hash) {
            console.log("Game data has already been extracted, skipping. Pass -check to the command line to ignore.");
            needExtract = false;
        }
    }
}

if (process.argv.includes("-extract")) {
    if (fs.existsSync("extract") && fs.existsSync("extract/_Success")) {
        console.log("Skipping extracting files.");
    } else {
        console.log("Unable to skip extracting files as no extracted files have been found. Please remove -extract from the command line.");
        process.exit(2);
    }
} else {
    if (needExtract) {
        if (fs.existsSync("extract") && fs.existsSync("extract/_Success")) fs.unlinkSync("extract/_Success");
        console.log("Extracting game data... Please wait. Pass -extract to skip this.");
        child_process.execFileSync("UnrealPak", ["..\\game.pak", "-Extract", "..\\extract"], { stdio: "inherit", cwd: "./paktool" });
        console.log("\nExtracting completed successfully.");
        fs.writeFileSync("extract/_Success", "");
        fs.writeFileSync("extract/_MD5", hash ?? "");
    } else {
        console.log("Extracting game data has been skipped.");
    }
}

if (fs.existsSync("output")) {
    console.log("Deleting previous output...");
    fs.rmSync("output", { recursive: true });
    console.log("Done.");
} else {
    console.log("No previous output found");
}

fs.mkdirSync("output");

console.log("Extracting sounds...");
require('./modules/sound');