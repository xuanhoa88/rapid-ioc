import { ServiceMetadata } from './metadata';
import type { Factory, ServiceIdentifier } from './types';

type Registry = Map<ServiceIdentifier, ServiceMetadata<unknown>>;

// Define private fields using Symbols to mimic private properties in ES2015
const _registeredFactories = Symbol('registeredFactories');
const _snapshots = Symbol('snapshots');
const _lockedFactories = Symbol('lockedFactories');

export class ServiceContainer {
  private [_registeredFactories]: Registry;
  private [_snapshots]: Registry[];
  private [_lockedFactories]: Set<ServiceIdentifier>;

  constructor() {
    this[_registeredFactories] = new Map();
    this[_snapshots] = [];
    this[_lockedFactories] = new Set();
  }

  /**
   * Bind a factory with optional transient behavior and lock status.
   * @throws Error if the service is already bound and is locked.
   */
  bind<T = unknown>(
    identifier: ServiceIdentifier<T>,
    factory: Factory<T>,
    transient = false,
    locked = false
  ): ServiceContainer {
    if (!identifier) {
      throw new Error('[bind] Identifier must not be null or undefined.');
    }

    if (this[_registeredFactories].has(identifier) && this[_lockedFactories].has(identifier)) {
      throw new Error(
        `[bind] Service "${identifier.toString()}" is locked and cannot be overridden.`
      );
    }

    const metadata = new ServiceMetadata(factory, transient);
    this[_registeredFactories].set(identifier, metadata);

    if (locked) {
      this[_lockedFactories].add(identifier);
    }

    return this;
  }

  /**
   * Unbind a service from the container.
   * @throws Error if the service is locked.
   */
  unbind(identifier: ServiceIdentifier): ServiceContainer {
    if (!identifier) {
      throw new Error('[unbind] Identifier must not be null or undefined.');
    }

    if (this[_lockedFactories].has(identifier)) {
      throw new Error(
        `[unbind] Service "${identifier.toString()}" is locked and cannot be unbound.`
      );
    }

    this[_registeredFactories].delete(identifier);
    this[_lockedFactories].delete(identifier);
    return this;
  }

  /**
   * Rebind a service to a new factory.
   * @throws Error if the service is locked.
   */
  rebind<T = unknown>(
    identifier: ServiceIdentifier<T>,
    factory: Factory<T>,
    transient = false
  ): ServiceContainer {
    if (!identifier) {
      throw new Error('[rebind] Identifier must not be null or undefined.');
    }

    if (this[_lockedFactories].has(identifier)) {
      throw new Error(
        `[rebind] Service "${identifier.toString()}" is locked and cannot be rebound.`
      );
    }

    return this.unbind(identifier).bind(identifier, factory, transient);
  }

  /**
   * Resolve a service from the container.
   * @throws Error if the service is not bound.
   */
  resolve<T = unknown>(identifier: ServiceIdentifier<T>): T {
    if (!identifier) {
      throw new Error('[resolve] Identifier must not be null or undefined.');
    }

    const service = this[_registeredFactories].get(identifier);
    if (!service) {
      throw new Error(`[resolve] Service "${identifier.toString()}" is not bound.`);
    }

    return service.getValue() as T;
  }

  /**
   * Take a snapshot of the current container state.
   */
  snapshot(): ServiceContainer {
    const snapshot: Registry = new Map(this[_registeredFactories]);
    this[_snapshots].push(snapshot);
    return this;
  }

  /**
   * Restore the container to the last snapshot state.
   * @throws Error if no snapshots are available.
   */
  restore(): ServiceContainer {
    if (this[_snapshots].length === 0) {
      throw new Error('[restore] No snapshots available to restore.');
    }

    this[_registeredFactories] = this[_snapshots].pop()!;
    return this;
  }
}
