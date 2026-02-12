import { Component, effect, inject, signal } from '@angular/core';
import { SchemaService } from '../services/schema.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule, MatSpinner } from '@angular/material/progress-spinner';
import { ConfigService } from '../services/config.service';
import { MatIconModule } from '@angular/material/icon';
import { TimeagoModule } from 'ngx-timeago';
import { Config } from '../models/config.models';
import { MatMenuModule } from '@angular/material/menu';
import { SettingsService } from '../services/settings.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfigComponent } from './config/config.component';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [
    ConfigComponent,
    MatToolbarModule,
    MatProgressSpinnerModule,
    MatIconModule,
    TimeagoModule,
    MatMenuModule,
    MatButtonModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  public schemaService = inject(SchemaService);
  public configService = inject(ConfigService);
  private settingsService = inject(SettingsService);

  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  constructor() {
    effect(() => {
      if (this.schemaService.schemasLoaded()) {
        this.configService.loadConfig();
      }
    });
  }

  applyConfig() {
    console.log('apply config');
  }

  loadConfig(config: Config) {
    this.configService.updateCurrentlyShownConfig(config);
  }

  downloadConfig() {
    const config = this.configService.currentlyShownConfig();
    if (config) {
      this.downloadJSON(config, 'config.json');
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
        type: 'text/json;charset=utf-8',
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
