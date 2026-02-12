import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ListsService {
  public actionListIds: string[] = [];
  public transformListIds: string[] = [];
  public moduleListsId: string[] = [];

  registerActionList(path: string | undefined) {
    if (path === undefined) {
      return '';
    }

    const id = this.pathToId(path);
    if (!this.actionListIds.includes(id)) {
      this.actionListIds.push(id);
    }
    return id;
  }

  registerTransformList(path: string | undefined) {
    if (path === undefined) {
      return '';
    }

    const id = this.pathToId(path);
    if (!this.transformListIds.includes(id)) {
      this.transformListIds.push(id);
    }
    return id;
  }

  pathToId(path: string) {
    return path.replaceAll('/', '.');
  }
}
