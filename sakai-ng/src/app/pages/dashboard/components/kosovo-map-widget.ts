import { Component, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';

@Component({
    selector: 'app-kosovo-map-widget',
    standalone: true,
    template: `
        <div class="card">
            <div class="font-semibold text-xl mb-4">User Distribution</div>
            <div #mapContainer style="height: 400px; width: 100%; border-radius: 8px;"></div>
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
            dragging: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            touchZoom: false,
            keyboard: false,
            zoomControl: false,
        });

        this.http.get('/assets/kosovo-geo.json').subscribe((geoJson: any) => {
            const layer = L.geoJSON(geoJson, {
                style: {
                    color: '#3b82f6',
                    weight: 2,
                    opacity: 1,
                    fillColor: '#93c5fd',
                    fillOpacity: 0.4
                },
                onEachFeature: (feature, layer) => {
                    if (feature.properties?.name) {
                        layer.bindTooltip(feature.properties.name, { sticky: true });
                    }
                }
            }).addTo(this.map);

            this.map.fitBounds(layer.getBounds());
        });
    }

    ngOnDestroy(): void {
        if (this.map) {
            this.map.remove();
        }
    }
}
