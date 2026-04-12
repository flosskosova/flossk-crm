import { Component } from '@angular/core';

@Component({
    selector: 'app-course',
    standalone: true,
    template: ` 
    <div class="card">
        <div class="font-semibold text-xl mb-4">Course Page</div>
        <p>Use this page to start from scratch and place your custom content.</p>
    </div>`
})
export class Course {}