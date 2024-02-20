import fs from "fs";

export function getDirs(source: fs.PathLike) {
    return fs
        .readdirSync(source, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
}
