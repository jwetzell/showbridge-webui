import { Component, computed, inject, input, model, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ProcessorConfig, RouteConfig } from '../../models/config';
import { SchemaService } from '../../services/schema';
import { JsonPipe } from '@angular/common';
import { ProcessorComponent } from '../processor/processor';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EventsService } from '../../services/events';
import { debounceTime, tap } from 'rxjs';
import { ConfigService } from '../../services/config';

@Component({
  selector: 'app-route',
  imports: [
    MatFormFieldModule,
    MatIconModule,
    ReactiveFormsModule,
    MatMenuModule,
    JsonPipe,
    ProcessorComponent,
    MatTooltipModule,
  ],
  templateUrl: './route.html',
  styleUrl: './route.css',
})
export class RouteComponent {
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

  route = model<RouteConfig>();
  moduleIds = input<string[]>([]);
  delete = output<void>();

  processors = computed(() => {
    const route = this.route();
    if (route) {
      return route.processors;
    }
    return [];
  });

  routeConfigErrors = computed(() => {
    const index = this.index();
    const routeErrors = this.configService.routeErrors();
    if (index !== undefined) {
      return routeErrors.filter((error) => error.index === index);
    }
    return [];
  });

  formGroup: FormGroup = new FormGroup({
    input: new FormControl('', [Validators.required]),
  });

  public schemaService = inject(SchemaService);
  private snackBar = inject(MatSnackBar);
  private eventsService = inject(EventsService);
  private configService = inject(ConfigService);

  indicatorColor = signal<string>('gray');

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

    if (this.index() !== undefined) {
      this.eventsService
        .getRouteEventsForIndex(this.index()!)
        .pipe(
          tap((routeEvent) => {
            this.indicatorColor.set(routeEvent.error ? 'red' : 'greenyellow');
          }),
          debounceTime(100),
        )
        .subscribe((routeEvent) => {
          this.indicatorColor.set('gray');
        });
    }
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
        const processors = route.processors || [];

        processors.push(processorTemplate);
        return {
          ...route,
          processors: [...processors],
        };
      }
      return route;
    });
    this.snackBar.open('Processor Added', 'Dismiss', {
      duration: 3000,
    });
  }

  processorUpdated(index: number, processor: ProcessorConfig | undefined) {
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
          processors: [...route.processors],
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
          processors: [...route.processors],
        };
      }
      return route;
    });
    this.snackBar.open('Processor Removed', 'Dismiss', {
      duration: 3000,
    });
  }
}
