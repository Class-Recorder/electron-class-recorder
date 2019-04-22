import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ElectronService } from '../../providers/electron.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

    formGroup: FormGroup;
    model: any;

    constructor(private _formBuilder: FormBuilder, private router: Router, private electronService: ElectronService) { }

    ngOnInit(): void {
        this.formGroup = this._formBuilder.group({
            videosFolder : ['', [Validators.required]],
            databaseFolder: ['', [Validators.required]]
        });
    }

    onSubmit() {
        if (this.formGroup.valid) {
            console.log(this.formGroup.get('videosFolder').value);
            console.log(this.formGroup.get('databaseFolder').value);
        }
    }
}
