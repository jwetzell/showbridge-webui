import { Component, computed, inject, input, model, output, signal } from '@angular/core';
import { ProcessorConfig } from '../../models/config';
import { SchemaService } from '../../services/schema';
import { MatIconModule } from '@angular/material/icon';
import { ParamsFormComponent } from '../params-form/params-form';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-processor',
  imports: [MatIconModule, ParamsFormComponent, ReactiveFormsModule],
  templateUrl: './processor.html',
  styleUrl: './processor.css',
})
export class ProcessorComponent {
  path = input<string>('');
  processor = model<ProcessorConfig>();
  delete = output<void>();

  params = computed(() => this.processor()!.params);

  schema = computed(() => {
    return this.processor()?.type
      ? this.schemaService.getSchemaForProcessorType(this.processor()!.type)
      : undefined;
  });

  hasParams = computed(() => {
    const schema = this.schema();
    return (
      schema !== undefined &&
      schema.properties !== undefined &&
      schema.properties.params !== undefined
    );
  });
  private schemaService = inject(SchemaService);

  paramsUpdated(params: any) {
    this.processor.update((processor) => {
      if (processor !== undefined) {
        if (params !== undefined) {
          return {
            ...processor,
            params: params,
          };
        }
        return {
          ...processor,
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
