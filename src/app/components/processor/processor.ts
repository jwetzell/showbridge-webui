import { CdkDragHandle, CdkDragPlaceholder, CdkDragPreview } from '@angular/cdk/drag-drop';
import { Component, computed, inject, input, model, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ProcessorConfig } from '../../models/config';
import { SchemaService } from '../../services/schema';
import { ParamsFormComponent } from '../params-form/params-form';

@Component({
  selector: 'app-processor',
  imports: [
    MatIconModule,
    ParamsFormComponent,
    ReactiveFormsModule,
    CdkDragHandle,
    CdkDragPreview,
    CdkDragPlaceholder,
  ],
  templateUrl: './processor.html',
  styleUrl: './processor.css',
})
export class ProcessorComponent {
  path = input<string>('');
  processor = model<ProcessorConfig>();
  delete = output<void>();

  inDragList = input<boolean>(false);

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
