import { Component, OnInit } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';
import { ThemeService } from './providers/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {


  currentTheme: string;

  constructor(
      private _overlayContainer: OverlayContainer,
      private _themeService: ThemeService,
  ) {}

  ngOnInit() {
      this.currentTheme = 'theme-dark';
      this.themeDark();
  }

  themeDark() {
      this._overlayContainer.getContainerElement().classList.add('theme-dark');
      document.querySelector('html').style.background = '#818181';
      this.currentTheme = 'theme-dark';
      this._themeService.setTheme(this.currentTheme);
  }

  themeIndigoPink() {
      this._overlayContainer.getContainerElement().classList.add('indigo-pink');
      document.querySelector('html').style.background = '#c2d6d6';
      this.currentTheme = 'indigo-pink';
      this._themeService.setTheme(this.currentTheme);
  }

}
