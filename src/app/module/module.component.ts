import { Component, computed, inject, input, model, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ModuleConfiguration } from '../../models/config.models';
import { SchemaService } from '../../services/schema.service';
import { ParamsFormComponent } from '../params-form/params-form.component';

@Component({
  selector: 'app-module',
  imports: [
    MatFormFieldModule,
    MatIconModule,
    ParamsFormComponent,
    ReactiveFormsModule,
    MatMenuModule,
  ],
  templateUrl: './module.component.html',
  styleUrl: './module.component.css',
})
export class ModuleComponent {
  path = input<string>('');
  module = model<ModuleConfiguration>();
  delete = output<void>();

  params = computed(() => this.module()!.params);
  id = computed(() => this.module()!.id);

  schema = computed(() => {
    return this.module()?.type
      ? this.schemaService.getSchemaForModuleType(this.module()!.type)
      : undefined;
  });

  formGroup: FormGroup = new FormGroup({
    id: new FormControl(''),
    type: new FormControl(''),
  });

  private schemaService = inject(SchemaService);

  ngOnInit(): void {
    this.formGroup.patchValue({
      id: this.module()?.id,
      type: this.module()?.type,
    });

    this.formGroup.valueChanges.subscribe((value) => {
      this.module.update((module) => {
        if (module) {
          module.id = value.id;
          module.type = value.type;
          return {
            ...module,
            id: module.id,
            type: module.type,
          };
        }
        return undefined;
      });
    });
  }

  paramsUpdated(params: any) {
    this.module.update((module) => {
      if (module !== undefined && module.params !== undefined) {
        module.params = params;
        return {
          ...module,
          params: module.params,
        };
      }
      return undefined;
    });
  }

  deleteMe() {
    this.delete.emit();
  }

  isInError(): boolean {
    const path = this.path();
    if (path) {
      return this.schemaService.errorPaths.includes(path);
    }
    return false;
  }
}
