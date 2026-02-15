import { HttpClient } from '@angular/common/http';
import { computed, effect, Injectable, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Ajv2020, JSONSchemaType } from 'ajv/dist/2020';
import { SomeJSONSchema } from 'ajv/dist/types/json-schema';
import { sortBy } from 'lodash-es';
import { Config, ModuleConfiguration, ProcessorConfiguration } from '../models/config.models';
import { ObjectInfo, ParamsFormInfo } from '../models/form.model';
import { SettingsService } from './settings.service';
import { RouteConfiguration } from '../models/config.models';

@Injectable({
  providedIn: 'root',
})
export class SchemaService {
  configSchema = signal<JSONSchemaType<Config> | undefined>(undefined);
  modulesSchema = signal<JSONSchemaType<ModuleConfiguration[]> | undefined>(undefined);
  routesSchema = signal<JSONSchemaType<RouteConfiguration[]> | undefined>(undefined);
  processorsSchema = signal<JSONSchemaType<ProcessorConfiguration[]> | undefined>(undefined);

  schemasLoaded = computed(() => {
    return (
      this.configSchema() !== undefined &&
      this.modulesSchema() !== undefined &&
      this.routesSchema() !== undefined &&
      this.processorsSchema() !== undefined
    );
  });

  ajv: Ajv2020 = new Ajv2020({ allErrors: true });

  processorTypes: ObjectInfo[] = [];
  moduleTypes: ObjectInfo[] = [];

  errorPaths: string[] = [];

  constructor(
    private http: HttpClient,
    private settingsService: SettingsService,
  ) {
    effect(() => {
      if (this.settingsService.configSchemaUrl()) {
        this.loadConfigSchema();
      }
    });

    effect(() => {
      if (this.settingsService.modulesSchemaUrl()) {
        this.loadModulesSchema();
      }
    });

    effect(() => {
      if (this.settingsService.routesSchemaUrl()) {
        this.loadRoutesSchema();
      }
    });

    effect(() => {
      if (this.settingsService.processorsSchemaUrl()) {
        this.loadProcessorsSchema();
      }
    });

    effect(() => {
      if (this.schemasLoaded()) {
        this.ajv.addSchema(this.modulesSchema()!);
        this.ajv.addSchema(this.routesSchema()!);
        this.ajv.addSchema(this.processorsSchema()!);
        this.ajv.compile(this.configSchema()!);
      }
    });
  }

  loadConfigSchema() {
    this.http
      .get<JSONSchemaType<Config>>(this.settingsService.configSchemaUrl().toString())
      .subscribe((schema) => {
        this.setConfigSchema(schema);
      });
  }

  loadModulesSchema() {
    this.http
      .get<
        JSONSchemaType<ModuleConfiguration[]>
      >(this.settingsService.modulesSchemaUrl().toString())
      .subscribe((schema) => {
        this.setModulesSchema(schema);
      });
  }

  loadRoutesSchema() {
    this.http
      .get<JSONSchemaType<RouteConfiguration[]>>(this.settingsService.routesSchemaUrl().toString())
      .subscribe((schema) => {
        this.setRoutesSchema(schema);
      });
  }

  loadProcessorsSchema() {
    this.http
      .get<
        JSONSchemaType<ProcessorConfiguration[]>
      >(this.settingsService.processorsSchemaUrl().toString())
      .subscribe((schema) => {
        this.setProcessorsSchema(schema);
      });
  }

  validate(data: any): boolean {
    if (this.schemasLoaded() && this.ajv) {
      this.ajv.validate('https://showbridge.io/config.schema.json', data);
      if (this.ajv.errors) {
        console.error('validation errors', this.ajv.errors);
        const errorPaths = new Set(
          this.ajv.errors.map((error) => {
            const errorPathMatch = error.instancePath.match(/(\/.*)\d+/);
            if (errorPathMatch) {
              return errorPathMatch[0]
                .substring(1)
                .replaceAll('handlers/', '')
                .replaceAll('/params', '');
            }
            return '';
          }),
        );
        this.errorPaths = Array.from(errorPaths);
        console.log(this.errorPaths);
        return false;
      } else {
        this.errorPaths = [];
      }
    }
    return true;
  }

  getSkeletonForRoute(): RouteConfiguration {
    const template: RouteConfiguration = {};
    return template;
  }

  getSkeletonForProcessor(processorType: string): ProcessorConfiguration {
    const template: ProcessorConfiguration = {
      type: processorType,
    };
    const itemInfo = this.processorTypes.find((itemInfo) => itemInfo.type === processorType);
    if (itemInfo?.schema?.required && itemInfo.schema.required.includes('params')) {
      template.params = this.getSkeletonForParamsSchema(
        itemInfo.schema.properties.params,
      ) as Record<string, any>;
    }
    return template;
  }

  getSkeletonForModule(moduleType: string): ModuleConfiguration {
    const template: ModuleConfiguration = {
      type: moduleType,
    };
    const itemInfo = this.moduleTypes.find((itemInfo) => itemInfo.type === moduleType);
    if (itemInfo?.schema?.required && itemInfo.schema.required.includes('params')) {
      template.params = this.getSkeletonForParamsSchema(
        itemInfo.schema.properties.params,
      ) as Record<string, any>;
    }
    return template;
  }

  getSkeletonForParamsSchema(paramsSchema: SomeJSONSchema): Record<string, any> {
    const paramsTemplate: any = {};
    if (paramsSchema.properties) {
      Object.entries(paramsSchema.properties).forEach(([paramKey, paramSchema]) => {
        const schema = paramSchema as any;
        switch (schema.type) {
          case 'array':
            if (paramsSchema.required?.includes(paramKey)) {
              paramsTemplate[paramKey] = [];
            }
            break;
          default:
            console.error(`schema-service: unhandled param skeleton type = ${schema.type}`);
            break;
        }
      });
    }

    return paramsTemplate;
  }

  setConfigSchema(schema: JSONSchemaType<Config>) {
    this.configSchema.set(schema);
  }

  setModulesSchema(schema: JSONSchemaType<ModuleConfiguration[]>) {
    this.modulesSchema.set(schema);
    this.moduleTypes = [];
    this.populateModuleTypes();
  }

  setRoutesSchema(schema: JSONSchemaType<RouteConfiguration[]>) {
    this.routesSchema.set(schema);
  }

  setProcessorsSchema(schema: JSONSchemaType<ProcessorConfiguration[]>) {
    this.processorsSchema.set(schema);
    this.processorTypes = [];
    this.populateProcessorTypes();
  }

  populateModuleTypes() {
    const modulesSchema = this.modulesSchema();
    if (modulesSchema !== undefined) {
      const definitions = modulesSchema.items?.oneOf;
      if (definitions) {
        this.moduleTypes = sortBy(
          Object.keys(definitions)
            .map((definitionKey) => definitions[definitionKey])
            .filter((definition) => definition.properties?.type?.const !== undefined)
            .map((definition) => {
              return {
                name: definition['title'],
                type: definition.properties?.type?.const,
                schema: definition,
              };
            }),
          ['name'],
        );
      }
    }
  }

  populateProcessorTypes() {
    const processorsSchema = this.processorsSchema();
    if (processorsSchema !== undefined) {
      const definitions = processorsSchema.items?.oneOf;
      if (definitions) {
        this.processorTypes = sortBy(
          Object.keys(definitions)
            .map((definitionKey) => definitions[definitionKey])
            .filter((definition) => definition.properties?.type?.const !== undefined)
            .map((definition) => {
              return {
                name: definition['title'],
                type: definition.properties?.type?.const,
                schema: definition,
              };
            }),
          ['name'],
        );
      }
    }
  }

  getSchemaForModuleType(protocolType: string) {
    const moduleType = this.moduleTypes.find((item) => item.type === protocolType);
    if (moduleType !== undefined) {
      return moduleType.schema;
    }
    return undefined;
  }

  getSchemaForProcessorType(protocolType: string) {
    const processorType = this.processorTypes.find((item) => item.type === protocolType);
    if (processorType !== undefined) {
      return processorType.schema;
    }
    return undefined;
  }

  matchParamsDataToSchema(data: any, schemas: SomeJSONSchema[]) {
    const matchingSchemaIndex = schemas.findIndex((schema) => {
      return this.ajv.validate(schema, data);
    });
    if (matchingSchemaIndex >= 0) {
      return matchingSchemaIndex;
    }
    return 0;
  }

  getFormInfoFromParamsSchema(schema: SomeJSONSchema): ParamsFormInfo {
    const paramsFormInfo: ParamsFormInfo = {
      formGroup: new FormGroup({}),
      paramsInfo: {},
    };
    if (schema?.properties) {
      const paramKeys = Object.keys(schema.properties);
      Object.entries(schema.properties).forEach(([paramKey, paramSchema]: [string, any]) => {
        if (paramSchema.type) {
          switch (paramSchema.type) {
            case 'string':
            case 'number':
            case 'integer':
            case 'boolean':
            case 'array': // TODO(jwetzell): actually handle arrays
            case 'object': // TODO(jwetzell): actually handle objects
              let formDefault = '';
              const validators: ValidatorFn[] = [];

              // NOTE(jwetzell): check for a default value to set
              if (paramSchema.const) {
                formDefault = paramSchema.const;
              } else if (paramSchema.default) {
                formDefault = paramSchema.default;
              }

              // NOTE(jwetzell): add as many validators as we can
              if (paramSchema.minimum) {
                validators.push(Validators.min(paramSchema.minimum));
              }

              if (paramSchema.maximum) {
                validators.push(Validators.max(paramSchema.maximum));
              }

              if (paramSchema.pattern) {
                validators.push(Validators.pattern(new RegExp(paramSchema.pattern)));
              }

              if (schema.required) {
                if (schema.required.includes(paramKey)) {
                  validators.push(Validators.required);
                }
              }


              paramsFormInfo.paramsInfo[paramKey] = {
                key: paramKey,
                display: paramSchema.title ? paramSchema.title : paramKey,
                type: paramSchema.type,
                hint: paramSchema.description,
                isConst: !!paramSchema.const,
                schema: paramSchema,
                placeholder: '',
                default: paramSchema.default ? paramSchema.default : undefined
              };

              if (paramSchema.examples && paramSchema.examples.length > 0) {
                paramsFormInfo.paramsInfo[paramKey].placeholder = paramSchema.examples[0];
              }

              if (paramSchema.type === 'object') {
                validators.push(this.objectValidator);
              }

              //TODO(jwetzell): figure out how to disable a control but not have to deal with undefined values on disabled controls
              paramsFormInfo.formGroup.addControl(
                paramKey,
                new FormControl(formDefault, validators),
              );

              if (paramSchema.enum) {
                paramsFormInfo.paramsInfo[paramKey].options = paramSchema.enum;
              }

              break;
            default:
              console.error(
                `schema-service: unhandled param schema type for form group = ${paramSchema.type}`,
              );
              break;
          }
        } else {
          console.error('schema-service: param property without type');
        }
      });
    } else {
      console.error('trigger-form: params schema without properties');
      console.error(schema);
    }
    return paramsFormInfo;
  }

  cleanArray(values: any[], itemSchema: SomeJSONSchema) {
    if (Array.isArray(values)) {
      switch (itemSchema.type) {
        case 'number':
          return values.map(Number.parseFloat);
        case 'integer':
          return values.map(Number.parseInt);
        case 'string':
          return values;
        case 'object':
          return values;
        default:
          console.error(`schema-service: unsupported array type ${itemSchema.type}`);
          return values;
      }
    }
    return [];
  }

  cleanParams(paramsSchema: SomeJSONSchema, params: any): any {
    Object.keys(params).forEach((paramKey) => {
      if (paramsSchema.properties[paramKey]) {
        const paramSchema = paramsSchema.properties[paramKey];

        // delete null/undefined/empty params that aren't required
        if (
          params[paramKey] === undefined ||
          params[paramKey] === null ||
          params[paramKey] === ''
        ) {
          if (paramSchema.required) {
            if (!paramSchema.includes(paramKey)) {
              delete params[paramKey];
              return;
            }
          } else {
            delete params[paramKey];
            return;
          }
        }

        if (paramSchema.type) {
          switch (paramSchema.type) {
            case 'integer':
              var paramValue = parseInt(params[paramKey]);
              // NOTE(jwetzell): delete non-numbers
              if (Number.isNaN(paramValue)) {
                delete params[paramKey];
              } else {
                params[paramKey] = paramValue;
              }
              break;
            case 'number':
              var paramValue = parseFloat(params[paramKey]);
              // NOTE(jwetzell): delete non-numbers
              if (Number.isNaN(paramValue)) {
                delete params[paramKey];
              } else {
                params[paramKey] = paramValue;
              }
              break;
            case 'array':
              if (!Array.isArray(params[paramKey])) {
                const paramValue = params[paramKey];
                params[paramKey] = this.parseStringToArray(paramValue, paramSchema);
              }
              break;
            case 'object':
              try {
                params[paramKey] = JSON.parse(params[paramKey]);
              } catch (error) {
                console.error('object param is not JSON');
              }
              break;
            case 'string':
              // string is default so nothing needs to happen to clean it's value
              break;
            default:
              console.log(`schema-service: unhandled param schema type: ${paramSchema.type}`);
              break;
          }
        }
      }
    });
    return params;
  }

  parseStringToArray(value: any, schema: SomeJSONSchema): any[] | undefined {
    if (!Array.isArray(value)) {
      const paramValue = value;
      if (paramValue === undefined || paramValue.trim().length === 0) {
        value = [];
      } else {
        if (schema.items?.type) {
          if (schema.items?.type === 'integer') {
            return paramValue
              .split(',')
              .map((part: string) => part.trim())
              .map((item: any) => parseInt(item));
          } else if (schema.items?.type === 'number') {
            return paramValue
              .split(',')
              .map((part: string) => part.trim())
              .map((item: any) => parseFloat(item));
          } else if (schema.items?.type === 'string') {
            return paramValue.split(',').map((part: string) => part.trim());
          } else if (schema.items?.type === 'object') {
            // TODO(jwetzell): this seems gross, not sure if this covers everything
            return JSON.parse(`[${paramValue}]`);
          } else {
            console.error(`schema-service: unhandled array schema type: ${schema.items?.type}`);
          }
        } else if (schema['$ref'] === '#/definitions/ActionList') {
          try {
            return JSON.parse(`[${paramValue}]`);
          } catch (error) {
            console.error('sub action list is not JSON');
          }
        } else {
          // NOTE(jwetzell): default to comma-separated strings
          return paramValue.split(',').map((part: string) => part.trim());
        }
      }
    }
    return undefined;
  }

  objectValidator(control: AbstractControl): ValidationErrors | null {
    try {
      JSON.parse(control.value);
      return null;
    } catch (error) {
      return { json: true };
    }
  }

  jsonValidator(validateSchema: SomeJSONSchema) {
    return (control: AbstractControl): ValidationErrors | null => {
      try {
        const jsonObj = JSON.parse(control.value);
        if (this.ajv.validate(validateSchema, jsonObj)) {
          return null;
        } else {
          return { json: this.ajv.errors };
        }
      } catch (error) {
        console.error(error);
        return { json: true };
      }
    };
  }
}
