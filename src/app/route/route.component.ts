import { Component, computed, inject, input, model, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ProcessorConfiguration, RouteConfiguration } from '../../models/config.models';
import { SchemaService } from '../../services/schema.service';
import { JsonPipe } from '@angular/common';
import { ProcessorComponent } from '../processor/processor.component';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-route',
  imports: [
    MatFormFieldModule,
    MatIconModule,
    ReactiveFormsModule,
    MatMenuModule,
    JsonPipe,
    ProcessorComponent,
  ],
  templateUrl: './route.component.html',
  styleUrl: './route.component.css',
})
export class RouteComponent {
  path = input<string>('');
  route = model<RouteConfiguration>();
  moduleIds = input<string[]>([]);
  delete = output<void>();

  processors = computed(() => {
    const route = this.route();
    if (route) {
      return route.processors;
    }
    return [];
  });

  formGroup: FormGroup = new FormGroup({
    input: new FormControl('', [Validators.required]),
  });

  public schemaService = inject(SchemaService);
  private snackBar = inject(MatSnackBar);

  ngOnInit(): void {
    this.formGroup.patchValue({
      input: this.route()?.input,
    });

    this.formGroup.valueChanges.subscribe((value) => {
      this.route.update((route) => {
        if (route) {
          route.input = value.input;
          return {
            ...route,
            input: route.input,
          };
        }
        return undefined;
      });
    });
  }

  isInError(): boolean {
    const path = this.path();
    if (path) {
      return this.schemaService.errorPaths.includes(path);
    }
    return false;
  }

  addProcessor(processorType: string) {
    const processorTemplate = this.schemaService.getSkeletonForProcessor(processorType);
    this.route.update((route) => {
      if (route) {
        if (!route.processors) {
          route.processors = [];
        }
        route.processors?.push(processorTemplate);
        return {
          ...route,
          processors: route.processors,
        };
      }
      return route;
    });
  }

  processorUpdated(index: number, processor: ProcessorConfiguration | undefined) {
    if (processor === undefined) {
      console.error('processor is undefined, not updating');
      return;
    }
    this.route.update((route) => {
      if (route && route.processors) {
        route.processors[index].type = processor.type;
        if (processor.params !== undefined) {
          route.processors[index].params = processor.params;
        }
        return {
          ...route,
          processors: route.processors,
        };
      }
      return route;
    });
  }

  deleteProcessor(index: number) {
    this.route.update((route) => {
      if (route && route.processors) {
        route?.processors?.splice(index, 1);
        return {
          ...route,
          processors: route.processors,
        };
      }
      return route;
    });
    this.snackBar.open('Processor Removed', 'Dismiss', {
      duration: 3000,
    });
  }
}
