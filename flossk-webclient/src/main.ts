import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app.config';
import { AppComponent } from './app.component';
import * as AOS from 'aos';

bootstrapApplication(AppComponent, appConfig)
    .then(() => {
        AOS.init({
            once: false,
            duration: 600,
            easing: 'ease-out-cubic'
        });
    })
    .catch((err) => console.error(err));
