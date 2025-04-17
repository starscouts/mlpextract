const fs = require("fs");
const path = require('path');
const child_process = require("child_process");
const xml2js = require('xml2js');
let folder = "./extract/MLP/Content/Wwise/Mac";

let extracted = 0;
let totalSize = 0;
fs.mkdirSync("./output/Sound");

if (!fs.existsSync(folder) || !fs.existsSync(folder + "/English(US)")) {
    console.log("Unable to find the folder containing audio files, make sure you have provided a valid .pak file for the Mac version of the game.");
    process.exit(2);
}

console.log("Extracting wem files...");

let audios = fs.readdirSync(folder).filter(i => i.endsWith(".wem"));
console.log("Found " + audios.length + " audio files.");

let names = {};

for (let json of fs.readdirSync(folder).filter(i => i.endsWith(".json"))) {
    let parsed = JSON.parse(fs.readFileSync(folder + "/" + json));
    if (parsed['SoundBanksInfo'] && parsed['SoundBanksInfo']['StreamedFiles']) {
        for (let file of parsed['SoundBanksInfo']['StreamedFiles']) {
            names[file['Id']] = file['ShortName'].replaceAll("\\", "/");
        }
    }
}

for (let audio of audios) {
    let name = "_" + path.basename(audio, ".wem") + ".ogg";
    let dir = "./output/Sound";

    if (names[path.basename(audio, ".wem")]) {
        dir = "./output/Sound/" + path.dirname(names[path.basename(audio, ".wem")]);
        name = path.basename(names[path.basename(audio, ".wem")], path.extname(names[path.basename(audio, ".wem")])) + ".ogg";
        fs.mkdirSync(dir, { recursive: true });
    }

    child_process.execFileSync("ww2ogg", ["." + folder + "/" + audio, "--pcb", "packed_codebooks_aoTuV_603.bin", "-o", "." + dir + "/._" + name], { stdio: "inherit", cwd: "./ww2ogg" });
    child_process.execFileSync("revorb", ["." + dir + "/._" + name, "." + dir + "/" + name], { stdio: "inherit", cwd: "./ww2ogg" });
    fs.unlinkSync(dir + "/._" + name);

    extracted++;
    totalSize += fs.lstatSync(dir + "/" + name).size;
}

console.log("Done extracting wem files.");

console.log("Extracting bnk files...");
let audios1 = fs.readdirSync(folder).filter(i => i.endsWith(".bnk"));
let audios2 = fs.readdirSync(folder + "/English(US)").filter(i => i.endsWith(".bnk"));
console.log("Found " + (audios1.length + audios2.length) + " audio packages.");
let i = 1;

(async () => {
    for (let bank of audios1) {
        let names = {};
        child_process.execFileSync("py", ["utils/wwiser.pyz", folder + "/" + bank], { stdio: "inherit" });

        const xml = fs.readFileSync(folder + "/" + bank + ".xml").toString();
        fs.unlinkSync(folder + "/" + bank + ".xml");

        const data = await xml2js.parseStringPromise(xml);

        if (!data['doc'] ||
        !data['doc']['base'] ||
        !data['doc']['base'][0] ||
        !data['doc']['base'][0]['root'] ||
        !data['doc']['base'][0]['root'][0] ||
        !data['doc']['base'][0]['root'][0]['obj'] ||
        !data['doc']['base'][0]['root'][0]['obj'].filter(i => i['$']['na'] === "MediaIndex") ||
        !data['doc']['base'][0]['root'][0]['obj'].filter(i => i['$']['na'] === "MediaIndex")[0] ||
        !data['doc']['base'][0]['root'][0]['obj'].filter(i => i['$']['na'] === "MediaIndex")[0]["lst"] ||
        !data['doc']['base'][0]['root'][0]['obj'].filter(i => i['$']['na'] === "MediaIndex")[0]["lst"][0] ||
        !data['doc']['base'][0]['root'][0]['obj'].filter(i => i['$']['na'] === "MediaIndex")[0]["lst"][0]["obj"]) {
            continue;
        }

        const items = data['doc']['base'][0]['root'][0]['obj'].filter(i => i['$']['na'] === "MediaIndex")[0]["lst"][0]["obj"];

        for (let item of items) {
            names[parseInt(item['$']['ix']) + 1] = item['fld'][0]['$']['gn'].replaceAll("\\\\", "\\").replaceAll("\\", "/");
        }

        for (let key of Object.keys(names)) {
            console.log(`[${key}] ${names[key]}`);
        }

        if (fs.existsSync("._bankTemp")) fs.rmSync("._bankTemp", { recursive: true });
        fs.mkdirSync("._bankTemp");
        child_process.execFileSync("..\\utils\\bnkextr", ["." + folder + "/" + bank], { stdio: "inherit", cwd: "._bankTemp" });

        for (let file of fs.readdirSync("._bankTemp")) {
            let name = "_" + bank + "_" + path.basename(file, ".wav") + ".ogg";
            let dir = "./output/Sound";

            if (names[parseInt(path.basename(file, ".wav").substring(1))]) {
                dir = "./output/Sound/" + path.dirname(names[parseInt(path.basename(file, ".wav").substring(1))]);
                name = path.basename(names[parseInt(path.basename(file, ".wav").substring(1))], path.extname(names[parseInt(path.basename(file, ".wav").substring(1))])) + ".ogg";
                fs.mkdirSync(dir, { recursive: true });
            }

            child_process.execFileSync("ww2ogg", ["../._bankTemp/" + file, "--pcb", "packed_codebooks_aoTuV_603.bin", "-o", "." + dir + "/._" + name], { stdio: "inherit", cwd: "./ww2ogg" });
            child_process.execFileSync("revorb", ["." + dir + "/._" + name, "." + dir + "/" + name], { stdio: "inherit", cwd: "./ww2ogg" });
            fs.unlinkSync(dir + "/._" + name);

            extracted++;
            totalSize += fs.lstatSync(dir + "/" + name).size;
        }

        fs.rmSync("._bankTemp", { recursive: true });
    }

    console.log("Done extracting bnk files.");
    console.log("Extracted " + extracted + " audio files total, " + totalSize + " bytes.");

    console.log("Extracting textures...");
    require("./textures");
})();