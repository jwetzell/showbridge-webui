import { JsonPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import * as yaml from 'js-yaml';
import { Config } from '../../models/config';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-config-preview',
  imports: [MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './config-preview.html',
  styleUrl: './config-preview.css',
})
export class ConfigPreviewComponent {
  config = input<Config | undefined>();

  yamlString = computed(() => {
    if (this.config() === undefined) {
      return '';
    }
    return yaml.dump(this.config());
  });

  downloadConfig() {
    const config = this.config();
    if (config) {
      this.downloadYAML(config, 'config.yaml');
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
