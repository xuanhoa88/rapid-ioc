import type { Factory } from './types';

// Define private fields using Symbols
const _factory = Symbol('factory');
const _instance = Symbol('instance');
const _transient = Symbol('transient');

export class ServiceMetadata<T> {
  // Declare private properties for the class
  private readonly [_factory]: Factory<T>;
  private [_instance]?: T; // Singleton instance
  private readonly [_transient]: boolean;

  /**
   * Constructor for ServiceMetadata.
   * @param factory - The factory function to create the service instance.
   * @param transient - Whether the service should be transient (true) or singleton (false).
   * @throws Error if the factory is invalid.
   */
  constructor(factory: Factory<T>, transient: boolean = false) {
    if (typeof factory !== 'function') {
      throw new Error(
        `[ServiceMetadata] Factory must be a callable function, received: ${typeof factory}`
      );
    }

    this[_factory] = factory;
    this[_instance] = undefined;
    this[_transient] = transient;
  }

  /**
   * Retrieves the value from the factory or cached singleton instance.
   * @returns T - The instance created by the factory.
   * @throws Error if the factory returns an undefined value.
   */
  getValue(): T {
    // For transient services, always create a new value
    if (this[_transient]) {
      return this[_factory]();
    }

    // For singleton services, return cached value or create it
    if (this[_instance] === undefined) {
      this[_instance] = this[_factory]();
    }

    return this[_instance];
  }
}
