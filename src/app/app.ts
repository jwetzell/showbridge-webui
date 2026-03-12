import { Component, effect, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterOutlet } from '@angular/router';
import * as yaml from 'js-yaml';
import { Config } from './models/config.models';
import { ConfigService } from './services/config.service';
import { EventsService } from './services/events.service';
import { SchemaService } from './services/schema.service';
import { SettingsService } from './services/settings.service';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-root',
  imports: [
    MatToolbarModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatTooltipModule,
    RouterOutlet
],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  public schemaService = inject(SchemaService);
  public configService = inject(ConfigService);

  public settingsService = inject(SettingsService);
  public eventsService = inject(EventsService);
  private snackBar = inject(MatSnackBar);
  constructor() {
    effect(() => {
      if (this.schemaService.schemasLoaded()) {
        this.configService.loadConfig();
      }
    });
  }

  applyConfig() {
    const config = this.configService.currentlyShownConfig();
    if (config !== undefined) {
      this.configService.uploadConfig(config);
      this.snackBar.open('Config Uploaded', 'Dismiss', {
        duration: 3000,
      });
    }
  }

  loadConfig(config: Config) {
    this.configService.updateCurrentlyShownConfig(config);
  }

  downloadConfig() {
    const config = this.configService.currentlyShownConfig();
    if (config) {
      this.downloadYAML(config, 'config.yaml');
    } else {
      this.snackBar.open('No config to download.', 'Dismiss', {
        duration: 3000,
      });
    }
  }

  downloadJSON(data: object, filename: string) {
    const content = JSON.stringify(data, null, 2);
    const dataUri = URL.createObjectURL(
      new Blob([content], {
        type: 'application/json;charset=utf-8',
      }),
    );
    const dummyLink = document.createElement('a');
    dummyLink.href = dataUri;
    dummyLink.download = filename;

    document.body.appendChild(dummyLink);
    dummyLink.click();
    document.body.removeChild(dummyLink);
  }

  downloadYAML(data: object, filename: string) {
    const content = yaml.dump(data);
    const dataUri = URL.createObjectURL(
      new Blob([content], {
        type: 'application/yaml;charset=utf-8',
      }),
    );
    const dummyLink = document.createElement('a');
    dummyLink.href = dataUri;
    dummyLink.download = filename;

    document.body.appendChild(dummyLink);
    dummyLink.click();
    document.body.removeChild(dummyLink);
  }
}
