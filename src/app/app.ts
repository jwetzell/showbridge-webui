import { Component, effect, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TimeagoModule } from 'ngx-timeago';
import { Config } from './models/config.models';
import { ConfigService } from './services/config.service';
import { SchemaService } from './services/schema.service';
import { ConfigComponent } from './components/config/config.component';
import * as yaml from 'js-yaml';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [
    MatToolbarModule,
    MatProgressSpinnerModule,
    MatIconModule,
    TimeagoModule,
    MatMenuModule,
    MatButtonModule,
    RouterOutlet
],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  public schemaService = inject(SchemaService);
  public configService = inject(ConfigService);

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
      this.configService.saveConfig(config);
      this.snackBar.open('Config Saved', 'Dismiss', {
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
