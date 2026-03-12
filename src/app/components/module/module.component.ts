import { Component, computed, inject, input, model, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ModuleConfig } from '../../models/config.models';
import { SchemaService } from '../../services/schema.service';
import { ParamsFormComponent } from '../params-form/params-form.component';
import { JsonPipe } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EventsService } from '../../services/events.service';
import { tap, debounceTime } from 'rxjs';
import { ConfigService } from '../../services/config.service';

@Component({
  selector: 'app-module',
  imports: [
    MatFormFieldModule,
    MatIconModule,
    ParamsFormComponent,
    ReactiveFormsModule,
    MatMenuModule,
    MatTooltipModule,
    JsonPipe,
  ],
  templateUrl: './module.component.html',
  styleUrl: './module.component.css',
})
export class ModuleComponent {
  path = input<string>('');
  index = computed(() => {
    const path = this.path();
    if (path) {
      const parts = path.split('/');
      const lastPart = parts[parts.length - 1];
      return parseInt(lastPart, 10);
    }
    return undefined;
  });

  module = model<ModuleConfig>();
  delete = output<void>();

  params = computed(() => this.module()!.params);
  id = computed(() => this.module()!.id);

  schema = computed(() => {
    return this.module()?.type
      ? this.schemaService.getSchemaForModuleType(this.module()!.type)
      : undefined;
  });

  moduleConfigErrors = computed(() => {
    const index = this.index();
    const moduleErrors = this.configService.moduleErrors();
    if (index !== undefined) {
      return moduleErrors.filter((error) => error.index === index);
    }
    return [];
  });

  formGroup: FormGroup = new FormGroup({
    id: new FormControl('', [Validators.required]),
    type: new FormControl(''),
  });

  inputIndicatorColor = signal<string>('gray');
  outputIndicatorColor = signal<string>('gray');

  private schemaService = inject(SchemaService);
  private eventsService = inject(EventsService);
  private configService = inject(ConfigService);
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
    if (this.id() !== undefined) {
      this.eventsService
        .getInputEventsForSource(this.id()!)
        .pipe(
          tap((inputEvent) => {
            this.inputIndicatorColor.set(inputEvent.error ? 'red' : 'greenyellow');
          }),
          debounceTime(100),
        )
        .subscribe((inputEvent) => {
          this.inputIndicatorColor.set('gray');
        });
      this.eventsService
        .getOutputEventsForDestination(this.id()!)
        .pipe(
          tap((outputEvent) => {
            this.outputIndicatorColor.set(outputEvent.error ? 'red' : 'greenyellow');
          }),
          debounceTime(100),
        )
        .subscribe((outputEvent) => {
          this.outputIndicatorColor.set('gray');
        });
    }
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
