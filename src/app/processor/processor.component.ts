import { Component, computed, inject, input, model, output, signal } from '@angular/core';
import { ProcessorConfiguration } from '../../models/config.models';
import { SchemaService } from '../../services/schema.service';
import { MatIconModule } from '@angular/material/icon';
import { ParamsFormComponent } from '../params-form/params-form.component';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-processor',
  imports: [MatIconModule, ParamsFormComponent, ReactiveFormsModule],
  templateUrl: './processor.component.html',
  styleUrl: './processor.component.css',
})
export class ProcessorComponent {
  path = input<string>('');
  processor = model<ProcessorConfiguration>();
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
        processor.params = params;
        return {
          ...processor,
          params: processor.params,
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
