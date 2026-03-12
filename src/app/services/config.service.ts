import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { cloneDeep } from 'lodash-es';
import { Config } from '../models/config.models';
import { SchemaService } from './schema.service';
import { HttpClient } from '@angular/common/http';
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

  private http = inject(HttpClient);
  private settingsService = inject(SettingsService);
  
  constructor(private schemaService: SchemaService) {
    this.loadConfig();
    effect(() => {
      console.log('config state changed', this.currentlyShownConfig());
    });
  }

  loadConfig() {
    // const configString = localStorage.getItem('config');
    // if (configString) {
    //   try {
    //     const config = JSON.parse(configString);
    //     const valid = this.schemaService.validate(config);
    //     if (valid) {
    //       console.log('Loaded config from local storage', config);
    //       this.updateCurrentlyShownConfig(config);
    //     } else {
    //       console.error('Config in local storage is invalid', config);
    //       this.setEmptyConfig();
    //     }
    //   } catch (e) {
    //     console.error('Failed to parse config from local storage', e);
    //     this.setEmptyConfig();
    //   }
    // } else {
    //   this.setEmptyConfig();
    // }
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

  setEmptyConfig() {
    console.log('Setting empty config');
    this.updateCurrentlyShownConfig({
      modules: [],
      routes: [],
    });
  }

  saveConfig(config: Config) {
    localStorage.setItem('config', JSON.stringify(config));
    console.log('Config saved to local storage', config);
  }

  updateCurrentlyShownConfig(config: Config) {
    // NOTE(jwetzell): mark the configStates that match the currently shown as such
    this.currentlyShownConfig.set(cloneDeep(config));
  }
}
