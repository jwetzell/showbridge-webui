import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ListsService {
  public processorListIds: string[] = [];

  registerProcessorList(path: string | undefined) {
    if (path === undefined) {
      return '';
    }

    const id = this.pathToId(path);
    if (!this.processorListIds.includes(id)) {
      this.processorListIds.push(id);
    }
    return id;
  }

  pathToId(path: string) {
    return path.replaceAll('/', '.');
  }
}
