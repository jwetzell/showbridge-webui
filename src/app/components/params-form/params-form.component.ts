import { JsonPipe } from '@angular/common';
import { Component, inject, Input, OnChanges, OnDestroy, OnInit, output, SimpleChange, SimpleChanges } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SomeJSONSchema } from 'ajv/dist/types/json-schema';
import { cloneDeep, has, isEqual } from 'lodash-es';
import { Subscription } from 'rxjs';
import { ParamInfo, ParamsFormInfo } from '../../models/form.model';
import { SchemaService } from '../../services/schema.service';
import { cleanParams, schemaToParamsFormInfo } from '../../utils/params';
import { ArrayFormComponent } from '../array-form/array-form.component';
@Component({
  selector: 'app-params-form',
  templateUrl: './params-form.component.html',
  styleUrls: ['./params-form.component.css'],
  imports: [
    MatIconModule,
    MatTooltipModule,
    JsonPipe,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    ArrayFormComponent,
    MatTabsModule,
  ],
  standalone: true,
})
export class ParamsFormComponent implements OnChanges, OnDestroy {
  @Input() paramsSchema?: SomeJSONSchema;
  @Input() data?: any;
  updated = output<any>();

  paramsFormInfo?: ParamsFormInfo;

  formGroupSubscription?: Subscription;

  ngOnDestroy(): void {
    if (this.formGroupSubscription) {
      this.formGroupSubscription.unsubscribe()
    }
  }

  ngOnChanges(changes: SimpleChanges<{
    paramsSchema: SomeJSONSchema
    data: any
  }>): void {
    if (changes.paramsSchema) {
      if (changes.paramsSchema.previousValue === undefined && changes.paramsSchema.currentValue !== undefined) {
        if (this.paramsSchema) {
          if (this.paramsSchema.properties) {
            this.paramsFormInfo = schemaToParamsFormInfo(this.paramsSchema);
            if (this.formGroupSubscription === undefined) {
              this.formGroupSubscription = this.paramsFormInfo?.formGroup.valueChanges.subscribe((value) => {
                this.formUpdated();
              });
            }
          } else {
            console.error('params is not a singular object');
            console.error(this.paramsSchema);
          }
        }
      }
    }

    if (changes.data) {
      if (!isEqual(changes.data.currentValue, changes.data.previousValue)) {
        if (this.paramsFormInfo?.formGroup !== undefined) {
          // NOTE(jwetzell): prepare data for form patching
          const dataToPatch = cloneDeep(this.data);
          Object.entries(this.paramsFormInfo.paramsInfo).forEach(([paramKey, paramInfo]) => {
            if (has(dataToPatch, paramKey)) {
              switch (paramInfo.type) {
                case 'object':
                  dataToPatch[paramKey] = JSON.stringify(dataToPatch[paramKey]);
                  break;
                case 'array':
                  dataToPatch[paramKey] = dataToPatch[paramKey]
                    .map((item: any) => {
                      switch (typeof item) {
                        case 'object':
                          return JSON.stringify(item);
                        default:
                          return item;
                      }
                    })
                    .join(',');
                  break;
                default:
                  break;
              }
            }
          });

          this.paramsFormInfo.formGroup.patchValue(dataToPatch);
        }
      }
    }
  }

  formUpdated() {
    if (this.paramsSchema) {
      const params = cleanParams(
        this.paramsSchema,
        this.paramsFormInfo?.formGroup.value,
      );
      this.updated.emit(params);
    } else {
      console.error('params-form: no paramsSchema loaded');
    }
  }

  paramKeys() {
    if (this.paramsFormInfo) {
      return Object.keys(this.paramsFormInfo?.formGroup.controls);
    }
    return [];
  }

  getParamInfo(key: string): ParamInfo | undefined {
    return this.paramsFormInfo?.paramsInfo[key];
  }

  getParamValue(key: string) {
    if (this.paramsSchema) {
      const params = cleanParams(
        this.paramsSchema,
        this.paramsFormInfo?.formGroup.value,
      );
      return params[key];
    }
  }


}
