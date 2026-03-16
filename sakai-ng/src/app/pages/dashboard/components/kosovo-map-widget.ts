import { Component, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import * as L from 'leaflet';
import { environment } from '@environments/environment.prod';

interface LocationStat {
    location: string;
    count: number;
    members: string[];
}

const CITY_COORDINATES: Record<string, [number, number]> = {
    'prishtina': [42.6629, 21.1655],
    'pristina': [42.6629, 21.1655],
    'prizren': [42.2139, 20.7397],
    'peja': [42.6597, 20.2883],
    'pejë': [42.6597, 20.2883],
    'gjakova': [42.3803, 20.4311],
    'gjakovë': [42.3803, 20.4311],
    'ferizaj': [42.3702, 21.1483],
    'uroševac': [42.3702, 21.1483],
    'mitrovica': [42.8914, 20.8659],
    'gjilan': [42.4636, 21.4688],
    'gnjilane': [42.4636, 21.4688],
    'vushtrri': [42.8248, 20.9697],
    'vučitrn': [42.8248, 20.9697],
    'podujeva': [42.9108, 21.1943],
    'suhareka': [42.3596, 20.8265],
    'suva reka': [42.3596, 20.8265],
    'lipjan': [42.5219, 21.1207],
    'drenas': [42.6248, 20.9017],
    'gllogovc': [42.6248, 20.9017],
    'rahovec': [42.3987, 20.6556],
    'orahovac': [42.3987, 20.6556],
    'skenderaj': [42.7451, 20.7896],
    'klinë': [42.6219, 20.5758],
    'kline': [42.6219, 20.5758],
    'istog': [42.7795, 20.4861],
    'deçan': [42.5400, 20.2898],
    'decani': [42.5400, 20.2898],
    'malisheva': [42.4840, 20.7447],
    'kaçanik': [42.2311, 21.2586],
    'kacanik': [42.2311, 21.2586],
    'shtime': [42.4330, 21.0378],
    'vitia': [42.3195, 21.3581],
    'viti': [42.3195, 21.3581],
    'kamenicë': [42.5840, 21.5800],
    'kamenica': [42.5840, 21.5800],
    'zveçan': [42.9076, 20.8342],
    'zvečan': [42.9076, 20.8342],
    'zubin potok': [42.9143, 20.6891],
    'leposaviq': [43.1050, 20.8009],
    'leposavic': [43.1050, 20.8009],
};

@Component({
    selector: 'app-kosovo-map-widget',
    standalone: true,
    template: `
        <div class="card">
            <div class="font-semibold text-xl mb-4">User Distribution</div>
            <div #mapContainer class="w-full rounded-lg" style="height: clamp(700px, 80vw, 750px);"></div>
        </div>
    `
})
export class KosovoMapWidget implements AfterViewInit, OnDestroy {
    @ViewChild('mapContainer') mapContainer!: ElementRef;

    private map!: L.Map;

    constructor(private http: HttpClient) {}

    ngAfterViewInit(): void {
        this.initMap();
    }

    private initMap(): void {
        this.map = L.map(this.mapContainer.nativeElement, {
            center: [42.6026, 20.903],
            zoom: 8,
            attributionControl: false,
            dragging: true,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            touchZoom: false,
            keyboard: false,
            zoomControl: false,
        });

        forkJoin({
            geoJson: this.http.get('/assets/kosovo-geo.json'),
            stats: this.http.get<LocationStat[]>(`${environment.apiUrl}/auth/users/location-stats`)
        }).subscribe(({ geoJson, stats }) => {
            console.log('Location stats:', stats);
            const layer = L.geoJSON(geoJson as any, {
                style: {
                    color: '#3b82f6',
                    weight: 2,
                    opacity: 1,
                    fillColor: '#93c5fd',
                    fillOpacity: 0.4
                }
            }).addTo(this.map);

            this.map.fitBounds(layer.getBounds());

            if (window.innerWidth < 768) {
                this.map.setZoom(this.map.getZoom() + 1);
            }

            const maxCount = Math.max(...stats.map(s => s.count), 1);

            stats.forEach(stat => {
                const key = stat.location.toLowerCase().trim();
                const coords = CITY_COORDINATES[key];
                if (!coords) return;

                const radius = 5 + (stat.count / maxCount) * 8;

                L.circleMarker(coords, {
                    radius,
                    color: 'transparent',
                    weight: 0,
                    fillColor: '#1d4ed8',
                    fillOpacity: 0.85,
                })
                .bindTooltip(
                    `<strong>${stat.location}</strong><br/>${stat.members.map(m => `<span>• ${m}</span>`).join('<br/>')}`,
                    { sticky: true, direction: 'top' }
                )
                .addTo(this.map);
            });
        });
    }

    ngOnDestroy(): void {
        if (this.map) {
            this.map.remove();
        }
    }
}
