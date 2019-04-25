import { spawn, ChildProcess } from 'child_process';
import * as _ from 'lodash';
import getAppDataPath from 'appdata-path';
import * as fs from 'fs-extra';
import * as path from 'path';
import { Configuration } from './configuration';
import { BrowserWindow } from 'electron';
const ipc = require('electron').ipcMain;

export class SpringBackendRunner {

    private JVM_LOCATION: string;
    private JAVA_SERVER_LOCATION: string;
    private SERVER_LOCATION: string;
    private APP_PROPERTIES_LOCATION_TEMPLATE: string;
    private APP_PROPERTIES_LOCATION: string;
    private APP_SYSTEM_FOLDER: string;
    private APP_PREVIOUS_DATA_LOCATION: string;
    private FFMPEG_LOCATION: string;
    private serverProcess: ChildProcess;

    public constructor(applicationDirectory: string, win: BrowserWindow) {
        const unpackedAsarDirectory = this.urlAsarUnpacked(applicationDirectory);
        if (process.platform === 'win32') {
            this.JVM_LOCATION = `${unpackedAsarDirectory}\\dependencies\\jvm\\bin\\java.exe`;
            this.JAVA_SERVER_LOCATION = `${unpackedAsarDirectory}\\executable\\class-recorder-pc.jar`;
            this.SERVER_LOCATION = `${unpackedAsarDirectory}\\executable`;
            this.APP_PROPERTIES_LOCATION_TEMPLATE = `${unpackedAsarDirectory}\\executable\\application.properties.template`;
            this.FFMPEG_LOCATION = `${unpackedAsarDirectory}\\dependencies\\ffmpeg.exe`;
        } else {
            this.JVM_LOCATION = `${unpackedAsarDirectory}/dependencies/jvm/bin/java`;
            this.JAVA_SERVER_LOCATION = `${unpackedAsarDirectory}/executable/class-recorder-pc.jar`;
            this.SERVER_LOCATION = `${unpackedAsarDirectory}/executable`;
            this.APP_PROPERTIES_LOCATION_TEMPLATE = `${unpackedAsarDirectory}/executable/application.properties.template`;
            this.FFMPEG_LOCATION = `${unpackedAsarDirectory}/dependencies/ffmpeg`;
        }
        this.APP_SYSTEM_FOLDER = getAppDataPath('class-recorder-data');
        this.APP_PROPERTIES_LOCATION = path.join(this.APP_SYSTEM_FOLDER, 'application.properties');
        this.APP_PREVIOUS_DATA_LOCATION = path.join(this.APP_SYSTEM_FOLDER, 'previous_data.json');

        if (!fs.existsSync(this.APP_SYSTEM_FOLDER)) {
            fs.mkdirSync(this.APP_SYSTEM_FOLDER);
        }

        ipc.on('load-previous-data', (event, arg) => {
            event.returnValue = this.loadConfiguration();
        });

        ipc.on('save-data-and-run-server', async (event, arg: Configuration) => {
            this.saveConfiguration(arg);
            event.returnValue = true;
            await this.executeJava(arg);
            win.loadURL('http://localhost:37132');
        });
    }

    private modifyApplicationProperties(data: Configuration) {
        let tempFolder = path.join(this.APP_SYSTEM_FOLDER, 'temp');
        let outputFfmpegFolder = path.join(this.APP_SYSTEM_FOLDER, 'outputffmpeg');
        let applicationProperties = fs.readFileSync(this.APP_PROPERTIES_LOCATION_TEMPLATE, {encoding: 'utf8'}).toString();
        applicationProperties = applicationProperties.replace('${databaseDir}', this.convertToWindowsDir(data.databaseFolder))
            .replace('${ffmpegDirectory}', `${this.convertToWindowsDir(this.FFMPEG_LOCATION)}`)
            .replace('${videos_folder}', `${this.convertToWindowsDir(data.videosFolder)}`)
            .replace('${temp_folder}', `${this.convertToWindowsDir(tempFolder)}`)
            .replace('${output_ffmpeg}', `${this.convertToWindowsDir(outputFfmpegFolder)}`);
        fs.writeFileSync(this.APP_PROPERTIES_LOCATION, applicationProperties, {encoding: 'utf8'});
    }

    public executeJava(data: Configuration): Promise<void> {
        return new Promise((resolve, reject) => {
            this.modifyApplicationProperties(data);
            this.serverProcess = spawn(this.JVM_LOCATION, ['-jar', this.JAVA_SERVER_LOCATION], {
                cwd: this.APP_SYSTEM_FOLDER
            });

            this.serverProcess.stderr.on('data', (data) => {
                console.log(data.toString());
            });

            this.serverProcess.stdout.on('data', (data) => {
                console.log(data.toString());
                if (data.includes('Started ClassrecorderApplication')) {
                    resolve();
                }
            });

            this.serverProcess.on('close', (code) => {
                if ( code === 0 ) {
                    console.log('Everything works fine');
                    resolve();
                } else {
                    reject('Error executing java');
                }
            });
        });
    }

    private urlAsarUnpacked(directory: string): string {
        return _.replace(directory, 'app.asar', 'app.asar.unpacked');
    }

    private convertToWindowsDir(dir): string {
        return dir.replace(/\\/g, '\\\\');
    }

    private saveConfiguration(data: Configuration) {
        fs.writeJsonSync(this.APP_PREVIOUS_DATA_LOCATION, data);
    }

    private loadConfiguration(): Configuration {
        if (fs.existsSync(this.APP_PREVIOUS_DATA_LOCATION)) {
           return fs.readJsonSync(this.APP_PREVIOUS_DATA_LOCATION);
        }
        return null;
    }

    public killServer() {
        this.serverProcess.kill();
    }
  
    public gitAttributesTest() {
    }

}
