import { spawn, ChildProcess } from 'child_process';
import * as _ from 'lodash';
import getAppDataPath from 'appdata-path';
import * as fs from 'fs-extra';
import * as path from 'path';
import { Utils } from './utils';

export class SpringBackendRunner {

    private JVM_LOCATION: string;
    private JAVA_SERVER_LOCATION: string;
    private SERVER_LOCATION: string;
    private APP_PROPERTIES_LOCATION_TEMPLATE: string;
    private APP_PROPERTIES_LOCATION: string;
    private APP_SYSTEM_FOLDER: string;
    private FFMPEG_LOCATION: string;
    private serverProcess: ChildProcess;

    public constructor(applicationDirectory: string) {
        const unpackedAsarDirectory = this.urlAsarUnpacked(applicationDirectory);
        if (process.platform === 'win32') {
            this.JVM_LOCATION = `${unpackedAsarDirectory}\\dependencies\\jvm\\bin\\java.exe`;
            this.JAVA_SERVER_LOCATION = `${unpackedAsarDirectory}\\executable\\class-recorder-pc.jar`;
            this.SERVER_LOCATION = `${unpackedAsarDirectory}\\executable`;
            this.APP_PROPERTIES_LOCATION_TEMPLATE = `${unpackedAsarDirectory}\\executable\\application.properties.template`;
            this.APP_PROPERTIES_LOCATION = `${unpackedAsarDirectory}\\executable\\application.properties`;
            this.FFMPEG_LOCATION = `${unpackedAsarDirectory}\\dependencies\\ffmpeg.exe`;
        } else {
            this.JVM_LOCATION = `${unpackedAsarDirectory}/dependencies/jvm/bin/java`;
            this.JAVA_SERVER_LOCATION = `${unpackedAsarDirectory}/executable/class-recorder-pc.jar`;
            this.SERVER_LOCATION = `${unpackedAsarDirectory}/executable`;
            this.APP_PROPERTIES_LOCATION_TEMPLATE = `${unpackedAsarDirectory}/executable/application.properties.template`;
            this.APP_PROPERTIES_LOCATION = `${unpackedAsarDirectory}/executable/application.properties`;
            this.FFMPEG_LOCATION = `${unpackedAsarDirectory}/dependencies/ffmpeg`;
        }
        this.APP_SYSTEM_FOLDER = getAppDataPath('class-recorder-data');
    }

    private modifyApplicationProperties(videosFolder: string, databaseDir: string) {
        let tempFolder = path.join(this.APP_SYSTEM_FOLDER, 'temp');
        let outputFfmpegFolder = path.join(this.APP_SYSTEM_FOLDER, 'outputffmpeg');
        let applicationProperties = fs.readFileSync(this.APP_PROPERTIES_LOCATION_TEMPLATE).toString();
        applicationProperties = applicationProperties.replace('${databaseDir}', this.convertToWindowsDir(databaseDir))
            .replace('${ffmpegDirectory}', `${this.convertToWindowsDir(this.FFMPEG_LOCATION)}`)
            .replace('${videos_folder}', `${this.convertToWindowsDir(videosFolder)}`)
            .replace('${temp_folder}', `${this.convertToWindowsDir(tempFolder)}`)
            .replace('${output_ffmpeg}', `${this.convertToWindowsDir(outputFfmpegFolder)}`);
        console.log(applicationProperties);
        fs.writeFileSync(this.APP_PROPERTIES_LOCATION, applicationProperties);
    }

    public executeJava(videosFolder: string, dataFolder: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.modifyApplicationProperties(videosFolder, dataFolder);
            this.serverProcess = spawn(this.JVM_LOCATION, ['-jar', this.JAVA_SERVER_LOCATION], {
                cwd: this.SERVER_LOCATION
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

    public toString() {
        console.log(this.JVM_LOCATION);
        console.log(this.APP_PROPERTIES_LOCATION);
        console.log(this.APP_PROPERTIES_LOCATION_TEMPLATE);
        console.log(this.APP_SYSTEM_FOLDER);
        console.log(this.FFMPEG_LOCATION);
        console.log(this.JAVA_SERVER_LOCATION);
        console.log(this.SERVER_LOCATION);
    }

}
