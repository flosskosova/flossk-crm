import { Component } from '@angular/core';
import { MembersPieChartWidget } from './memberspiechart';
import { KosovoMapWidget } from "./kosovo-map-widget";

@Component({
    selector: 'app-statistics',
    imports: [MembersPieChartWidget, KosovoMapWidget],
    standalone: true,
    template: ` 
    <div class="grid grid-cols-12 gap-8">    
        <div class="col-span-12 lg:col-span-6">
            <app-members-pie-chart-widget />
        </div>
        <div class="col-span-12 lg:col-span-6">
            <app-kosovo-map-widget />
        </div>
    </div>`
})
export class Statistics { }
