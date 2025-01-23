import { expect } from 'chai';
import sinon from 'sinon';
import { ServiceContainer } from '../dist';

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

      expect(container.resolve<string>(exampleSymbol)).to.equal('hello world 1');
      expect(container.resolve<string>(exampleSymbol)).to.equal('hello world 2');
      expect(container.resolve<string>(exampleSymbol)).to.equal('hello world 3');
    });

    it('should bind and retrieve singleton factories', () => {
      let count = 1;
      container.bind<string>(exampleSymbol, () => `hello world ${count++}`);

      expect(container.resolve<string>(exampleSymbol)).to.equal('hello world 1');
      expect(container.resolve<string>(exampleSymbol)).to.equal('hello world 1');
      expect(container.resolve<string>(exampleSymbol)).to.equal('hello world 1');
    });

    it('should reuse cached values for singleton factories', () => {
      const spy = sinon.stub().returns('test');
      container.bind<string>(exampleSymbol, spy);

      container.resolve(exampleSymbol);
      container.resolve(exampleSymbol);

      expect(spy.callCount).to.equal(1);
      expect(container.resolve<string>(exampleSymbol)).to.equal('test');
    });
  });

  describe('Locked Factories', () => {
    it('should not allow rebinding or unbinding locked services', () => {
      container.bind(exampleSymbol, () => 'locked', false, true);

      expect(() => container.rebind(exampleSymbol, () => 'unlocked')).to.throw(
        `[rebind] Service "Symbol(example)" is locked and cannot be rebound.`
      );

      expect(() => container.unbind(exampleSymbol)).to.throw(
        `[unbind] Service "Symbol(example)" is locked and cannot be unbound.`
      );
    });

    it('should allow resolving locked services', () => {
      container.bind(exampleSymbol, () => 'locked', false, true);
      expect(container.resolve<string>(exampleSymbol)).to.equal('locked');
    });
  });

  describe('Error Handling', () => {
    it('should throw if identifier is null or undefined', () => {
      expect(() => container.bind(null as any, () => null)).to.throw(
        '[bind] Identifier must not be null or undefined.'
      );
      expect(() => container.unbind(undefined as any)).to.throw(
        '[unbind] Identifier must not be null or undefined.'
      );
      expect(() => container.resolve(undefined as any)).to.throw(
        '[resolve] Identifier must not be null or undefined.'
      );
    });

    it('should throw if resolving unbound services', () => {
      expect(() => container.resolve(exampleSymbol)).to.throw(
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

      expect(container.resolve('service1')).to.deep.equal({ id: 1 });
      expect(container.resolve('service2')).to.deep.equal({ id: 2 });

      container.restore();

      expect(() => container.resolve('service2')).to.throw(
        Error,
        '[resolve] Service "service2" is not bound.'
      );
      expect(container.resolve('service1')).to.deep.equal({ id: 1 });
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

      expect(container.resolve('service1')).to.deep.equal({ id: 1 });
      expect(container.resolve('service2')).to.deep.equal({ id: 2 });
      expect(container.resolve('service3')).to.deep.equal({ id: 3 });

      container.restore();
      expect(container.resolve('service1')).to.deep.equal({ id: 1 });
      expect(container.resolve('service2')).to.deep.equal({ id: 2 });
      expect(() => container.resolve('service3')).to.throw(
        Error,
        '[resolve] Service "service3" is not bound.'
      );

      container.restore();
      expect(container.resolve('service1')).to.deep.equal({ id: 1 });
      expect(() => container.resolve('service2')).to.throw(
        Error,
        '[resolve] Service "service2" is not bound.'
      );
    });

    it('should throw an error when restoring with no snapshots', () => {
      expect(() => container.restore()).to.throw(
        Error,
        '[restore] No snapshots available to restore.'
      );
    });

    it('should not include modifications made after the snapshot', () => {
      const factory1 = () => ({ id: 1 });
      container.bind('service1', factory1);
      container.snapshot();

      const factory2 = () => ({ id: 2 });
      container.bind('service2', factory2);

      container.restore();
      expect(() => container.resolve('service2')).to.throw(
        Error,
        '[resolve] Service "service2" is not bound.'
      );
      expect(container.resolve('service1')).to.deep.equal({ id: 1 });
    });
  });
});
