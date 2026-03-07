import { Component, inject, model } from '@angular/core';
import { ModuleComponent } from '../module/module.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ModuleConfiguration } from '../../models/config.models';
import { SchemaService } from '../../services/schema.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-module-list',
  imports: [
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    ModuleComponent
  ],
  templateUrl: './module-list.component.html',
  styleUrl: './module-list.component.css',
})
export class ModuleListComponent {
  modules = model<ModuleConfiguration[]>();
  public schemaService = inject(SchemaService);

  private snackBar = inject(MatSnackBar);

  moduleUpdated(index: number, module: ModuleConfiguration | undefined) {
    if (module === undefined) {
      console.error('module is undefined, not updating');
      return;
    }
    this.modules.update((modules) => {
      if (modules) {
        modules[index].id = module.id;
        modules[index].type = module.type;
        if (module.params !== undefined) {
          modules[index].params = module.params;
        }
        return [...modules];
      }
      return modules;
    });
  }

  addModule(moduleType: string) {
    const moduleTemplate = this.schemaService.getSkeletonForModule(moduleType);
    this.modules.update((modules) => {
      if (modules) {
        if (!modules) {
          modules = [];
        }
        modules?.push(moduleTemplate);
        return [...modules];
      }
      return modules;
    });
    this.snackBar.open('Module Added', 'Dismiss', {
      duration: 3000,
    });
  }

  deleteModule(index: number) {
    this.modules.update((modules) => {
      if (modules) {
        modules?.splice(index, 1);
        return [...modules];
      }
      return [];
    });
    this.snackBar.open('Module Removed', 'Dismiss', {
      duration: 3000,
    });
  }
}
