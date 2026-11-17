import { Global, Injectable, Logger, Module } from '@nestjs/common';
import { DomainEvent, DomainEventType } from './domain-events';

export interface DomainEventListener {
  handle(event: DomainEvent): Promise<void> | void;
}

// Observer: subject, listeners subscribe to event types
@Injectable()
export class DomainEventPublisher {
  private readonly logger = new Logger(DomainEventPublisher.name);
  private readonly listeners = new Map<DomainEventType, DomainEventListener[]>();

  subscribe(types: DomainEventType[], listener: DomainEventListener) {
    for (const type of types) {
      const list = this.listeners.get(type) ?? [];
      list.push(listener);
      this.listeners.set(type, list);
    }
  }

  async publish(event: DomainEvent) {
    for (const listener of this.listeners.get(event.type) ?? []) {
      try {
        await listener.handle(event);
      } catch (e) {
        this.logger.error(`${event.type} listener failed: ${String(e)}`);
      }
    }
  }
}

@Global()
@Module({
  providers: [DomainEventPublisher],
  exports: [DomainEventPublisher],
})
export class EventsModule {}
