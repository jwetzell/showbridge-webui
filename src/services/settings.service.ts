import { computed, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  public isDummySite: boolean = false;
  public configSchemaPath = signal('/config.schema.json');
  public modulesSchemaPath = signal('/modules.schema.json');
  public routesSchemaPath = signal('/routes.schema.json');
  public processorsSchemaPath = signal('/processors.schema.json');
  public baseUrl = signal(window.location.href);

  public configSchemaUrl = computed(() => {
    return new URL(this.configSchemaPath(), this.baseUrl());
  });

  public modulesSchemaUrl = computed(() => {
    return new URL(this.modulesSchemaPath(), this.baseUrl());
  });

  public routesSchemaUrl = computed(() => {
    return new URL(this.routesSchemaPath(), this.baseUrl());
  });

  public processorsSchemaUrl = computed(() => {
    return new URL(this.processorsSchemaPath(), this.baseUrl());
  });

  constructor() {}

  updateBaseUrl(baseUrl: string) {
    this.baseUrl.set(baseUrl);
  }
}
