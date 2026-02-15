import { JsonPipe } from '@angular/common';
import { Component, inject, Input, OnInit, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SomeJSONSchema } from 'ajv/dist/types/json-schema';
import { cloneDeep, has } from 'lodash-es';
import { Subscription } from 'rxjs';
import { ParamInfo, ParamsFormInfo } from '../../models/form.model';
import { SchemaService } from '../../services/schema.service';
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
export class ParamsFormComponent implements OnInit {
  @Input() paramsSchema?: SomeJSONSchema;
  @Input() data?: any;
  updated = output<any>();

  paramsFormInfo?: ParamsFormInfo;

  formGroupSubscription?: Subscription;
  paramsOptions: {
    display: string;
    paramsFormInfo: ParamsFormInfo;
    keys: string[];
    schema: SomeJSONSchema;
  }[] = [];
  paramsOptionsSelectedIndex: number = 0;

  private schemaService = inject(SchemaService);

  constructor() {}

  ngOnInit(): void {
    if (this.paramsSchema) {
      if (this.paramsSchema.properties) {
        this.paramsFormInfo = this.schemaService.getFormInfoFromParamsSchema(this.paramsSchema);
      } else if (this.paramsSchema.oneOf) {
        this.paramsOptions = this.paramsSchema.oneOf.map((oneOf: any, index: number) => {
          const paramsOption = {
            display: oneOf.title ? oneOf.title : `Option ${index + 1}`,
            schema: oneOf,
            paramsFormInfo: this.schemaService.getFormInfoFromParamsSchema(oneOf),
          };
          return {
            ...paramsOption,
            keys: Object.keys(paramsOption.paramsFormInfo.formGroup.controls),
          };
        });
        const matchingSchemaIndex = this.schemaService.matchParamsDataToSchema(
          this.data,
          this.paramsOptions.map((paramsOption) => paramsOption.schema),
        );

        this.paramsOptionsSelectedIndex = matchingSchemaIndex;
        this.paramsFormInfo = this.paramsOptions[matchingSchemaIndex].paramsFormInfo;
        this.paramsSchema = this.paramsOptions[matchingSchemaIndex].schema;
      } else {
        console.error('params is not a singular or oneOf');
        console.error(this.paramsSchema);
      }
    }

    if (this.data && this.paramsFormInfo?.formGroup) {
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

    this.formGroupSubscription = this.paramsFormInfo?.formGroup.valueChanges.subscribe((value) => {
      this.formUpdated();
    });
  }

  paramsOptionsTabSelected(event: MatTabChangeEvent) {
    // NOTE(jwetzell): no longer interested in the old formGroup valueChanges
    if (this.formGroupSubscription) {
      this.formGroupSubscription.unsubscribe();
    }

    const paramsOption = this.paramsOptions[event.index];

    this.paramsSchema = paramsOption.schema;
    this.paramsFormInfo = paramsOption.paramsFormInfo;

    // NOTE(jwetzell): modify params that should change from the data when switch paramOptions
    Object.entries(this.paramsFormInfo.paramsInfo).forEach(([paramKey, paramInfo]) => {
      if (this.data !== undefined) {
        if (paramInfo.isConst) {
          if (this.data[paramKey]) {
            delete this.data[paramKey];
          }
        }
  
        if (paramInfo.default) {
          if (this.data[paramKey] !== undefined && this.data[paramKey] !== paramInfo.default) {
            this.data[paramKey] = paramInfo.default;
          }
        }
      }
    });

    const allowedParamKeys = Object.keys(this.paramsSchema?.properties);
    if (this.data) {
      // NOTE(jwetzell): remove keys that aren't allowed in the new params variation
      Object.keys(this.data).forEach((paramKey) => {
        if (allowedParamKeys && !allowedParamKeys.includes(paramKey)) {
          delete this.data[paramKey];
        }
      });
    }

    if (this.paramsFormInfo.formGroup) {
      this.formGroupSubscription = this.paramsFormInfo.formGroup.valueChanges.subscribe((value) => {
        this.formUpdated();
      });
    }

    if (this.data && this.paramsFormInfo.formGroup) {
      this.paramsFormInfo.formGroup.patchValue(this.data);
    }
  }

  formUpdated() {
    if (this.paramsSchema) {
      const params = this.schemaService.cleanParams(
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
      const params = this.schemaService.cleanParams(
        this.paramsSchema,
        this.paramsFormInfo?.formGroup.value,
      );
      return params[key];
    }
  }
}
