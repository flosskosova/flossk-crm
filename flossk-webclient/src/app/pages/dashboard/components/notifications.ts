import { Component } from '@angular/core';
import { NotificationsWidget } from './notificationswidget';

@Component({
    selector: 'app-notifications',
    imports: [NotificationsWidget],
    template: `
    <div class="card">
        <app-notifications-widget />
    </div>
    `
})
export class Notifications {}
