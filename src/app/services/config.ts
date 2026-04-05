import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { cloneDeep, isEqual } from 'lodash-es';
import { Config, ConfigError, ModuleError, RouteError } from '../models/config';
import { SchemaService } from './schema';
import { HttpClient } from '@angular/common/http';
import { SettingsService } from './settings';
import { EventsService } from './events';
@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  pendingConfigIsValid = computed(() => {
    const config = this.currentlyShownConfig();
    if (config === undefined) {
      return false;
    }
    return this.schemaService.validate(config);
  });
  currentlyShownConfig = signal<Config | undefined>(undefined);
  runningConfig = signal<Config | undefined>(undefined);

  configIsDirty = computed(() => {
    const currentlyShown = this.currentlyShownConfig();
    const running = this.runningConfig();
    if (currentlyShown === undefined || running === undefined) {
      return false;
    }
    return !isEqual(currentlyShown, running);
  });

  moduleErrors = signal<ModuleError[]>([]);
  routeErrors = signal<RouteError[]>([]);

  private http = inject(HttpClient);
  private settingsService = inject(SettingsService);
  private eventsService = inject(EventsService);

  constructor(private schemaService: SchemaService) {
    effect(() => {
      console.log('config state changed', this.currentlyShownConfig());
    });

    effect(() => {
      switch (this.eventsService.status()) {
        case 'open':
          console.log('Websocket connection opened, reloading config');
          this.loadConfig();
          break;
      }
    });
  }

  loadConfig() {
    const configUrl = this.settingsService.configUrl();
    if (!configUrl) {
      console.error('Config URL is not set');
      this.setEmptyConfig();
      return;
    }
    this.http.get<Config>(configUrl.toString()).subscribe({
      next: (config) => {
        if (this.schemaService.validate(config)) {
          this.updateCurrentlyShownConfig(config);
          this.runningConfig.set(cloneDeep(config));
        } else {
          console.error('Config from server is invalid', config);
          this.setEmptyConfig();
        }
      },
      error: (err) => {
        console.error('Failed to load config from server', err);
        this.setEmptyConfig();
      },
    });
  }

  uploadConfig(config: Config) {
    if (this.schemaService.validate(config)) {
      this.updateCurrentlyShownConfig(config);
      const configUrl = this.settingsService.configUrl();
      if (!configUrl) {
        console.error('Config URL is not set, cannot upload config');
        return;
      }
      this.http.put<ConfigError>(configUrl.toString(), config).subscribe({
        next: () => {
          console.log('Config uploaded successfully');
          this.moduleErrors.set([]);
          this.routeErrors.set([]);
          this.runningConfig.set(cloneDeep(config));
        },
        error: (err) => {
          console.error('Problems occurred while uploading config', err);
          if (err.error) {
            const configError: ConfigError = err.error;
            this.moduleErrors.set(configError.moduleErrors ?? []);
            this.routeErrors.set(configError.routeErrors ?? []);
          }
          this.runningConfig.set(cloneDeep(config));
        },
      });
    } else {
      console.error('Uploaded config is invalid', config);
    }
  }

  setEmptyConfig() {
    console.log('Setting empty config');
    this.updateCurrentlyShownConfig({
      api: {
        enabled: true,
        port: 8080,
      },
      modules: [],
      routes: [],
    });
  }

  updateCurrentlyShownConfig(config: Config) {
    this.currentlyShownConfig.set(cloneDeep(config));
  }
}
