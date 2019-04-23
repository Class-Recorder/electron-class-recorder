import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ElectronService } from '../../providers/electron.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

    formGroup: FormGroup;
    model = {
        videosFolder: "",
        databaseFolder: ""
    };

    constructor(private _formBuilder: FormBuilder,
        private router: Router,
        private electronService: ElectronService,
        private ngxLoader: NgxUiLoaderService) { }

    ngOnInit(): void {
        this.formGroup = this._formBuilder.group({
            videosFolder : ['', [Validators.required]],
            databaseFolder: ['', [Validators.required]]
        });
        this.loadData();
    }

    loadData() {
        let previousData = this.electronService.ipcRenderer.sendSync('load-previous-data');
        console.log(previousData);
        if (previousData != null) {
            this.formGroup.get('videosFolder').setValue(previousData.videosFolder);
            this.formGroup.get('databaseFolder').setValue(previousData.databaseFolder);
        }
    }

    saveDataAndRunServer() {
        const data = {
            videosFolder: this.formGroup.get('videosFolder').value,
            databaseFolder: this.formGroup.get('databaseFolder').value
        };
        console.log(data);
        this.electronService.ipcRenderer.sendSync('save-data-and-run-server', data);
        this.ngxLoader.start();
    }

    onSubmit() {
        if (this.formGroup.valid) {
            this.saveDataAndRunServer();
        }
    }

    selectFolderVideos() {
        this.formGroup.get("videosFolder")
        .setValue(this.electronService.dialog
        .showOpenDialog(this.electronService.remote.getCurrentWindow(), {
              properties: ['openDirectory']
        })[0]);
    }

    selectDatabaseFolder() {
        this.formGroup.get("databaseFolder")
        .setValue(this.electronService.dialog
        .showOpenDialog(this.electronService.remote.getCurrentWindow(), {
              properties: ['openDirectory']
        })[0]);
    }
}
