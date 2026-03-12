import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Config, ModuleConfiguration, RouteConfiguration } from '../../models/config.models';
import { ConfigService } from '../../services/config.service';
import { SchemaService } from '../../services/schema.service';
import { ModuleListComponent } from '../module-list/module-list.component';
import { RouteListComponent } from '../route-list.component/route-list.component';
import { EventsService } from '../../services/events.service';

@Component({
  selector: 'app-config',
  imports: [
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    ModuleListComponent,
    RouteListComponent,
  ],
  templateUrl: './config.component.html',
  styleUrl: './config.component.css',
})
export class ConfigComponent {
  config = computed<Config | undefined>(() => this.configService.currentlyShownConfig());

  modules = computed(() => this.config()?.modules ?? []);
  routes = computed(() => this.config()?.routes ?? []);

  moduleIds = computed(() => {
    const config = this.config();
    if (config !== undefined && config.modules !== undefined) {
      return config.modules.map((module) => module.id!) ?? [];
    }
    return [];
  });

  public configService = inject(ConfigService);
  public schemaService = inject(SchemaService);

  public eventsService = inject(EventsService);

  modulesUpdated(modules: ModuleConfiguration[] | undefined) {
    if (modules === undefined) {
      console.error('modules is undefined, not updating');
      return;
    }
    this.configService.currentlyShownConfig.update((config) => {
      if (config) {
        return {
          ...config,
          modules: modules,
        };
      }
      return config;
    });
  }

  routesUpdated(routes: RouteConfiguration[] | undefined) {
    if (routes === undefined) {
      console.error('routes is undefined, not updating');
      return;
    }
    this.configService.currentlyShownConfig.update((config) => {
      if (config) {
        return {
          ...config,
          routes: routes,
        };
      }
      return config;
    });
  }
}
