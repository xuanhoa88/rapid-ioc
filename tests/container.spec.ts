import { ServiceContainer, ServiceIdentifier } from '../src';

describe('ServiceContainer', () => {
  let container: ServiceContainer;

  const exampleSymbol = Symbol.for('example');

  beforeEach(() => {
    container = new ServiceContainer();
  });

  describe('Factory Bindings', () => {
    it('should bind and retrieve transient factories', () => {
      let count = 1;
      container.bind<string>(exampleSymbol, () => `hello world ${count++}`, true);

      expect(container.resolve<string>(exampleSymbol)).toBe('hello world 1');
      expect(container.resolve<string>(exampleSymbol)).toBe('hello world 2');
      expect(container.resolve<string>(exampleSymbol)).toBe('hello world 3');
    });

    it('should bind and retrieve singleton factories', () => {
      let count = 1;
      container.bind<string>(exampleSymbol, () => `hello world ${count++}`);

      expect(container.resolve<string>(exampleSymbol)).toBe('hello world 1');
      expect(container.resolve<string>(exampleSymbol)).toBe('hello world 1');
      expect(container.resolve<string>(exampleSymbol)).toBe('hello world 1');
    });

    it('should reuse cached values for singleton factories', () => {
      const spy = jest.fn().mockReturnValue('test');
      container.bind<string>(exampleSymbol, spy);

      container.resolve(exampleSymbol);
      container.resolve(exampleSymbol);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(container.resolve<string>(exampleSymbol)).toBe('test');
    });
  });

  describe('Locked Factories', () => {
    it('should not allow rebinding or unbinding locked services', () => {
      container.bind(exampleSymbol, () => 'locked', false, true);

      expect(() => container.rebind(exampleSymbol, () => 'unlocked')).toThrow(
        `[rebind] Service "Symbol(example)" is locked and cannot be rebound.`
      );

      expect(() => container.unbind(exampleSymbol)).toThrow(
        `[unbind] Service "Symbol(example)" is locked and cannot be unbound.`
      );
    });

    it('should allow resolving locked services', () => {
      container.bind(exampleSymbol, () => 'locked', false, true);
      expect(container.resolve<string>(exampleSymbol)).toBe('locked');
    });
  });

  describe('Error Handling', () => {
    it('should throw if identifier is null or undefined', () => {
      expect(() => container.bind(null as unknown as ServiceIdentifier, () => null)).toThrow(
        '[bind] Identifier must not be null or undefined.'
      );
      expect(() => container.unbind(undefined as unknown as ServiceIdentifier)).toThrow(
        '[unbind] Identifier must not be null or undefined.'
      );
      expect(() => container.resolve(undefined as unknown as ServiceIdentifier)).toThrow(
        '[resolve] Identifier must not be null or undefined.'
      );
    });

    it('should throw if resolving unbound services', () => {
      expect(() => container.resolve(exampleSymbol)).toThrow(
        `[resolve] Service "Symbol(example)" is not bound.`
      );
    });
  });

  describe('Snapshots', () => {
    it('should restore the previous state', () => {
      const factory1 = () => ({ id: 1 });
      const factory2 = () => ({ id: 2 });

      container.bind('service1', factory1);
      container.snapshot();
      container.bind('service2', factory2);

      expect(container.resolve('service1')).toEqual({ id: 1 });
      expect(container.resolve('service2')).toEqual({ id: 2 });

      container.restore();

      expect(() => container.resolve('service2')).toThrow(
        '[resolve] Service "service2" is not bound.'
      );
      expect(container.resolve('service1')).toEqual({ id: 1 });
    });

    it('should handle restoring multiple snapshots', () => {
      const factory1 = () => ({ id: 1 });
      const factory2 = () => ({ id: 2 });
      const factory3 = () => ({ id: 3 });

      container.bind('service1', factory1);
      container.snapshot();

      container.bind('service2', factory2);
      container.snapshot();

      container.bind('service3', factory3);

      expect(container.resolve('service1')).toEqual({ id: 1 });
      expect(container.resolve('service2')).toEqual({ id: 2 });
      expect(container.resolve('service3')).toEqual({ id: 3 });

      container.restore();
      expect(container.resolve('service1')).toEqual({ id: 1 });
      expect(container.resolve('service2')).toEqual({ id: 2 });
      expect(() => container.resolve('service3')).toThrow(
        '[resolve] Service "service3" is not bound.'
      );

      container.restore();
      expect(container.resolve('service1')).toEqual({ id: 1 });
      expect(() => container.resolve('service2')).toThrow(
        '[resolve] Service "service2" is not bound.'
      );
    });

    it('should throw an error when restoring with no snapshots', () => {
      expect(() => container.restore()).toThrow('[restore] No snapshots available to restore.');
    });

    it('should not include modifications made after the snapshot', () => {
      const factory1 = () => ({ id: 1 });
      container.bind('service1', factory1);
      container.snapshot();

      const factory2 = () => ({ id: 2 });
      container.bind('service2', factory2);

      container.restore();
      expect(() => container.resolve('service2')).toThrow(
        '[resolve] Service "service2" is not bound.'
      );
      expect(container.resolve('service1')).toEqual({ id: 1 });
    });
  });
});
