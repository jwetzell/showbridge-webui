import { Component, computed, inject, model } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Config, ModuleConfiguration, RouteConfiguration } from '../../models/config.models';
import { SchemaService } from '../../services/schema.service';
import { ModuleComponent } from '../module/module.component';
import { RouteComponent } from '../route/route.component';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-config',
  imports: [
    MatMenuModule,
    MatIconModule,
    ModuleComponent,
    RouteComponent,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './config.component.html',
  styleUrl: './config.component.css',
})
export class ConfigComponent {
  config = model<Config>();

  modules = computed(() => this.config()?.modules ?? []);
  routes = computed(() => this.config()?.routes ?? []);

  moduleIds = computed(() => {
    const config = this.config();
    if (config !== undefined && config.modules !== undefined) {
      return config.modules.map((module) => module.id!) ?? [];
    }
    return [];
  });

  public schemaService = inject(SchemaService);

  private snackBar = inject(MatSnackBar);

  deleteModule(index: number) {
    this.config.update((config) => {
      if (config && config.modules) {
        config?.modules?.splice(index, 1);
        return {
          ...config,
          modules: config.modules,
        };
      }
      return config;
    });
    this.snackBar.open('Module Removed', 'Dismiss', {
      duration: 3000,
    });
  }

  deleteRoute(index: number) {
    this.config.update((config) => {
      if (config && config.routes) {
        config?.routes?.splice(index, 1);
        return {
          ...config,
          routes: config.routes,
        };
      }
      return config;
    });
    this.snackBar.open('Route Removed', 'Dismiss', {
      duration: 3000,
    });
  }

  moduleUpdated(index: number, module: ModuleConfiguration | undefined) {
    if (module === undefined) {
      console.error('module is undefined, not updating');
      return;
    }
    this.config.update((config) => {
      if (config && config.modules) {
        config.modules[index].id = module.id;
        config.modules[index].type = module.type;
        if (module.params !== undefined) {
          config.modules[index].params = module.params;
        }
        return {
          ...config,
          modules: config.modules,
        };
      }
      return config;
    });
  }

  routeUpdated(index: number, route: RouteConfiguration | undefined) {
    if (route === undefined) {
      console.error('route is undefined, not updating');
      return;
    }
    this.config.update((config) => {
      if (config && config.routes) {
        config.routes[index].input = route.input;
        config.routes[index].output = route.output;
        return {
          ...config,
          routes: config.routes,
        };
      }
      return config;
    });
  }

  addModule(moduleType: string) {
    const moduleTemplate = this.schemaService.getSkeletonForModule(moduleType);
    this.config.update((config) => {
      if (config) {
        if (!config.modules) {
          config.modules = [];
        }
        config.modules?.push(moduleTemplate);
        return {
          ...config,
          modules: config.modules,
        };
      }
      return config;
    });
  }

  addRoute() {
    const routeTemplate = this.schemaService.getSkeletonForRoute();
    this.config.update((config) => {
      if (config) {
        if (!config.routes) {
          config.routes = [];
        }
        config.routes?.push(routeTemplate);
        return {
          ...config,
          routes: config.routes,
        };
      }
      return config;
    });
  }
}
