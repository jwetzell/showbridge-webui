import { Component, inject, input, model } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ModuleConfig, RouteConfig } from '../../models/config.models';
import { SchemaService } from '../../services/schema.service';
import { RouteComponent } from '../route/route.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-route-list',
  imports: [
    RouteComponent,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './route-list.component.html',
  styleUrl: './route-list.component.css',
})
export class RouteListComponent {

  routes = model<RouteConfig[]>();
  moduleIds = input<string[]>();
  public schemaService = inject(SchemaService);

  private snackBar = inject(MatSnackBar);
  
  deleteRoute(index: number) {
    this.routes.update((routes) => {
      if (routes) {
        routes?.splice(index, 1);
        return [...routes];
      }
      return routes;
    });
    this.snackBar.open('Route Removed', 'Dismiss', {
      duration: 3000,
    });
  }

  routeUpdated(index: number, route: RouteConfig | undefined) {
    if (route === undefined) {
      console.error('route is undefined, not updating');
      return;
    }
    this.routes.update((routes) => {
      if (routes) {
        routes[index].input = route.input;
        return [...routes];
      }
      return routes;
    });
  }

  addRoute() {
    const routeTemplate = this.schemaService.getSkeletonForRoute();
    this.routes.update((routes) => {
      if (!routes) {
        routes = [];
      }
      routes?.push(routeTemplate);
      return [...routes];
    });
    this.snackBar.open('Route Added', 'Dismiss', {
      duration: 3000,
    });
  }
}
