import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { PlayStepsComponent } from './components/play-steps/play-steps.component';
import { PlaybookComponent } from './components/playbook/playbook.component';
import { ToolboxComponent } from './components/toolbox/toolbox.component';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    PlayStepsComponent,
    PlaybookComponent,
    ToolboxComponent
  ],
  imports: [BrowserModule],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
