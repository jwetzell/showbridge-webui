import { computed, effect, Injectable, signal } from '@angular/core';
import { cloneDeep } from 'lodash-es';
import { Config } from '../models/config.models';
import { SchemaService } from './schema.service';
import { SettingsService } from './settings.service';
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

  constructor(private schemaService: SchemaService) {
    this.loadConfig();
    effect(() => {
      console.log('config state changed', this.currentlyShownConfig());
    });
  }

  loadConfig() {
    // TODO(jwetzell): load from local storage
    this.updateCurrentlyShownConfig({
      modules: [
        {
          id: 'http',
          type: 'http.server',
          params: {
            port: 8080,
          },
        },
        {
          id: 'http',
          type: 'http.server',
          params: {
            port: 8080,
          },
        },
        {
          id: 'http',
          type: 'http.server',
          params: {
            port: 8080,
          },
        },
        {
          id: 'http',
          type: 'http.server',
          params: {
            port: 8080,
          },
        },
        {
          id: 'http',
          type: 'http.server',
          params: {
            port: 8080,
          },
        },
        {
          id: 'http',
          type: 'http.server',
          params: {
            port: 8080,
          },
        },
        {
          id: 'http',
          type: 'http.server',
          params: {
            port: 8080,
          },
        },
      ],
      routes: [],
    });
  }

  saveConfig(config: Config) {
    // TODO(jwetzell): save to local storage
    console.log('saveConfig');
    console.log(config);
  }

  updateCurrentlyShownConfig(config: Config) {
    // NOTE(jwetzell): mark the configStates that match the currently shown as such
    this.currentlyShownConfig.set(cloneDeep(config));
  }
}
