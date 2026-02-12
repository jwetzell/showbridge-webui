import { Component, inject, input, model, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { RouteConfiguration } from '../../models/config.models';
import { SchemaService } from '../../services/schema.service';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-route',
  imports: [MatFormFieldModule, MatIconModule, ReactiveFormsModule, MatMenuModule, JsonPipe],
  templateUrl: './route.component.html',
  styleUrl: './route.component.css',
})
export class RouteComponent {
  path = input<string>('');
  route = model<RouteConfiguration>();
  delete = output<void>();

  formGroup: FormGroup = new FormGroup({
    input: new FormControl('', [Validators.required]),
    output: new FormControl('', [Validators.required]),
  });

  private schemaService = inject(SchemaService);

  ngOnInit(): void {
    this.formGroup.patchValue({
      input: this.route()?.input,
      output: this.route()?.output,
    });

    this.formGroup.valueChanges.subscribe((value) => {
      this.route.update((route) => {
        if (route) {
          route.input = value.input;
          route.output = value.output;
          return {
            ...route,
            input: route.input,
            output: route.output,
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
}
