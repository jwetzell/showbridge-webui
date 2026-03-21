import { effect, inject, Injectable, signal } from '@angular/core';
import {
  InputEventData,
  OutputEventData,
  RouteEventData,
  RouterEvent,
} from '../models/events.models';
import { filter, Subject } from 'rxjs';
import { SettingsService } from './settings.service';
@Injectable({
  providedIn: 'root',
})
export class EventsService {
  status = signal<string>('closed');
  socket?: WebSocket;
  private routeEvents$ = new Subject<RouterEvent<'route', RouteEventData>>();
  private inputEvents$ = new Subject<RouterEvent<'input', InputEventData>>();
  private outputEvents$ = new Subject<RouterEvent<'output', OutputEventData>>();
  private settingsService = inject(SettingsService);

  constructor() {
    effect(() => {
      console.log('Websocket URL changed:', this.settingsService.wsUrl());
      this.reload();
    });
  }

  reload() {
    try {
      this.socket = new WebSocket(this.settingsService.wsUrl());
      this.socket.onopen = () => {
        this.status.set('open');
      };

      this.socket.onclose = () => {
        this.status.set('closed');
        // TODO(jwetzell): this could probably be better done
        setTimeout(() => {
          this.reload();
        }, 2000);
      };

      this.socket.onerror = (error) => {
        this.status.set('error');
      };

      this.socket.onmessage = (event) => {
        const messageObj = JSON.parse(event.data);
        switch (messageObj.type) {
          case 'route':
            this.routeEvents$.next(messageObj);
            break;
          case 'input':
            this.inputEvents$.next(messageObj);
            break;
          case 'output':
            this.outputEvents$.next(messageObj);
            break;
          default:
            console.warn('Unknown event type:', messageObj.type);
        }
      };
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
    }
  }

  getRouteEventsForIndex(index: number) {
    return this.routeEvents$.pipe(filter((event) => event.data?.index === index));
  }

  getInputEventsForSource(source: string) {
    return this.inputEvents$.pipe(filter((event) => event.data?.source === source));
  }

  getOutputEventsForDestination(destination: string) {
    return this.outputEvents$.pipe(filter((event) => event.data?.destination === destination));
  }

  sendEvent<T, D>(event: RouterEvent<T, D>) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('sending event:', event);
      this.socket.send(JSON.stringify(event));
    } else {
      console.warn('WebSocket is not open. Cannot send event:', event);
    }
  }
}
