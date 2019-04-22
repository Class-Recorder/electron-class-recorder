
import fs from 'fs-extra';
import path from 'path';
import log from 'fliplog';
import progress from 'request-progress';
import request from 'request';
import decompressTarGz from 'decompress-targz';
import decompress from 'decompress';
import decompressUnzip from 'decompress-unzip';
import del from 'del';

function downloadResource(resourceName, resourceUrl, resourcePath, destination) {
    return new Promise((resolve, reject) => {
        log.time().green(`Downloading ${resourceName}`).echo();
        if (!fs.existsSync(destination)) {
            fs.mkdirSync(destination);
        }
        if (fs.existsSync(resourcePath)) {
            log.time().green(`${resourceName} is currently downloaded`).echo();
        } else {
            const resourceDownloadedFile = fs.createWriteStream(resourcePath);
            const resourceRequest = request(resourceUrl);
            progress(resourceRequest)
                .on('progress', (state) => {
                    process.stdout.write('Speed: ' + parseFloat(state.speed / 1024 / 1024).toFixed(2) +
                    ' MB/s - Downloaded: ' + parseFloat(state.size.transferred / 1024 / 1024).toFixed(2) + ' MB\r');
                })
                .on('error', (err) => {
                    console.log(err);
                    reject();
                })
                .on('end', () => {
                    log.time().green(`Downloaded ${resourceName} in: ${resourcePath}`).echo();
                    resolve();
                })
                .pipe(resourceDownloadedFile);
        }
    });
}

async function tarGzDec(filePath, destination, destDir, fileName) {
    return await decompress(filePath, destination, {
        plugins: [decompressTarGz()]
    });
}

function renameJVM(jvmFileVersion, destDir) {
    let folderName;
    if (process.platform === 'win32') {
        folderName = path.parse(jvmFileVersion).name;
    } else if (process.platform === 'linux') {
        folderName = path.parse(path.parse(jvmFileVersion).name).name;
    }
    const newName = 'jvm';
    const oldFolderDir = path.join(destDir, folderName);
    const newFolderDir = path.join(destDir, newName);
    console.log(oldFolderDir);
    console.log(newFolderDir);
    fs.renameSync(oldFolderDir, newFolderDir);
}

async function unzipDec(filePath, destination) {
    return await decompress(filePath, destination, {
        plugins: [decompressUnzip()]
    });
}

async function prepareDependencies() {
    const projectRoot = process.cwd();
    const destDir = path.join(projectRoot, 'dependencies');
    await del([destDir]);

    // JVM
    let jvmFileVersion;
    let urlJvm;
    if (process.platform === 'win32') {
        jvmFileVersion = 'zulu8.38.0.13-ca-jdk8.0.212-win_x64.zip';
        urlJvm = `https://cdn.azul.com/zulu/bin/${jvmFileVersion}`
    } else if (process.platform === 'linux') {
        jvmFileVersion = 'zulu8.38.0.13-ca-jre8.0.212-linux_x64.tar.gz';
        urlJvm = `https://cdn.azul.com/zulu/bin/${jvmFileVersion}`;
    } else {
        throw Error('OS is not valid to bundle dependencies');
    }
    const jvmFile = path.resolve(destDir, jvmFileVersion);

    // FFMPEG
    let ffmpegFileVersion;
    let urlFfmpeg;
    if (process.platform === 'win32') {
        ffmpegFileVersion = 'ffmpeg-4.1-win-64.zip';
        urlFfmpeg = `https://github.com/vot/ffbinaries-prebuilt/releases/download/v4.1/${ffmpegFileVersion}`;
    } else if (process.platform === 'linux') {
        ffmpegFileVersion = 'ffmpeg-4.1-linux-64.zip';
        urlFfmpeg = `https://github.com/vot/ffbinaries-prebuilt/releases/download/v4.1/${ffmpegFileVersion}`;
    }
    const ffmpegFile = path.resolve(destDir, ffmpegFileVersion);

    try {
        // JVM
        await downloadResource('JVM', urlJvm, jvmFile, destDir);
        if (process.platform === 'linux') {
            await tarGzDec(jvmFile, destDir, destDir, jvmFileVersion);
        } else {
            await unzipDec(jvmFile, destDir);
        }
        renameJVM(jvmFileVersion, destDir);
        // FFMPEG
        await downloadResource('Ffmpeg', urlFfmpeg, ffmpegFile, destDir);
        await unzipDec(ffmpegFile, destDir);

        // Remove trash files
        del([`${destDir}/__MACOSX`]);
        del([`${destDir}/${jvmFileVersion}`]);
        del([`${destDir}/${ffmpegFileVersion}`]);

    } catch (error) {
        fs.removeSync(jvmFile);
        console.log(error);
    }
}

async function downloadClassRecorderRelease() {
    const projectRoot = process.cwd();
    const execDir = path.join(projectRoot, 'executable');
    const jarName = 'class-recorder-pc.jar';
    const url = `https://github.com/Class-Recorder/class-recorder/releases/download/0.9.1/${jarName}`;
    const jarFile = path.join(execDir, jarName);
    await del([execDir]);
    await downloadResource('Class-recorder', url, jarFile, execDir);
}

async function main() {
    await prepareDependencies();
    await downloadClassRecorderRelease();
}

main();
