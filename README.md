# rapid-ioc

This library implements dependency injection for JavaScript and TypeScript.

## Features

- **No decorators**: Avoids the complexity of decorators.
- **Simple**: Minimal functionality for ease of use.
- **Cached by default**: Dependencies are created and cached once.
- **Configurable cache**: Cache can be turned off as needed.
- **Testing-friendly**: Built with unit testing in mind.
- **Flexible rebinding**: Supports dependency rebinding.
- **Snapshot and restore**: Capture and revert container states.
- **Locked services**: Prevents overrides or unbinding for critical services.
- **No reflection metadata required**: Saves approximately 50kb.
- **TypeScript support**: 100% written in TypeScript.

## Installation

Install the library using npm:

```bash
npm install rapid-ioc
```

## Container API

### Creating a Container

A container is where all dependencies are bound. Multiple containers can coexist in a project.

```ts
import { ServiceContainer } from 'rapid-ioc';

const container = new ServiceContainer();
```

### Binding Dependencies

#### Binding Keys

Keys can be classes, functions, symbols, or strings.

```ts
const ServiceKey = () => new Service();
const ServiceToken = createToken<ServiceInterface>('ServiceToken');

container.bind<ServiceInterface>(Service, () => new Service());
container.bind<ServiceInterface>(ServiceKey, () => new Service());
container.bind<ServiceInterface>(Symbol.for('Service'), () => new Service());
container.bind<ServiceInterface>('Service', () => new Service());
container.bind<ServiceInterface>(ServiceToken, () => new Service());
```

#### Binding a Class

Factory functions are used to create dependencies.

```ts
container.bind<ServiceInterface>(Service, () => new Service());
```

#### Binding a Value

```ts
container.bind<ServiceInterface>(Service, () => 'just a string');
```

### Locked Services

The `locked` status prevents overriding or unbinding a service once it has been registered. This is particularly useful for services that should remain immutable throughout the application lifecycle.

#### Binding a Locked Service

To bind a service with a locked status, set the `locked` parameter to `true` when calling the `bind` method:

```ts
container.bind<ServiceInterface>(Service, () => new Service(), false, true); // Locked service
```

#### Behavior of Locked Services

1. **Prevent Rebinding**: Once a service is locked, attempting to rebind it will throw an error.
2. **Prevent Unbinding**: Locked services cannot be removed from the container.

#### Example Usage

```ts
// Bind a locked service
container.bind<ServiceInterface>(Service, () => new Service(), false, true);

// Attempt to rebind the service (throws an error)
try {
  container.rebind<ServiceInterface>(Service, () => new MockService());
} catch (e) {
  console.error(e.message); // Outputs: "Service 'Service' is locked and cannot be rebound."
}

// Attempt to unbind the service (throws an error)
try {
  container.unbind(Service);
} catch (e) {
  console.error(e.message); // Outputs: "Service 'Service' is locked and cannot be unbound."
}

// Resolving the locked service still works as expected
const instance = container.resolve<ServiceInterface>(Service);
```

### Rebinding Dependencies

Rebinding is useful for unit tests but should be avoided in production.

```ts
container.rebind<ServiceMock>(symbol, () => new ServiceMock());
```

### Removing Bindings

Use this function sparingly in production code. It removes the dependency from the container.

```ts
container.unbind(symbol);
```

### Transient Mode

To create a new instance every time, specify metadata:

```ts
class Service {
constructor() {
    console.log('Creating a new Service instance');
}
}

class User {
constructor(public service: Service) {
    console.log('Creating a new User instance');
}
}

const container = new ServiceContainer();

// Bind Service as transient (new instance each time)
container.bind(Service, () => new Service(), true); // Ensure transient for Service

// Bind User with a singleton Service (same Service instance shared between User instances)
container.bind(User, () => new User(container.resolve(Service))); // Singleton binding for User

// Fetch instances
const service1 = container.resolve(Service); // Should log: "Creating a new Service instance" and "Creating a new User instance"
const service2 = container.resolve(Service); // Should log: "Creating a new Service instance" and "Creating a new User instance"

// Explanation: `service1` and `service2` will be **different instances** of `Service`
// because `Service` is bound as transient.

const user1 = container.resolve(User); // Should log: "Creating a new Service instance" and "Creating a new User instance"
const user2 = container.resolve(User); // Should log: "Creating a new Service instance" and "Creating a new User instance"

// Explanation: `user1` and `user2` will be **same instance** of `User` because `User` is bound as singleton.
// Both `user1` and `user2` will share the **same instance of `Service`** since the `Service` instance is reused in singleton mode.

console.log(service1 === service2); // false (Service is transient, so different instances are created each time)
console.log(user1 === user2); // true (User is singleton, same instance will be shared)
console.log(user1.service === user2.service); // true (Since Service is singleton, both User instances will share the same Service instance)
```

### Retrieving Dependencies

```ts
const ServiceKey = () => new Service();

container.resolve(Service);
container.resolve<ServiceInterface>(ServiceKey);
container.resolve<ServiceInterface>(Symbol.for('Service'));
container.resolve<ServiceInterface>('Service');
```

### Handling Dependencies

Dependencies must be created explicitly within factory functions.

```ts
// service.ts
class Service {}

container.bind(Service, () => new Service());

// module.ts
class Module {
  constructor(private service: Service) {}
}

container.bind(Module, () => new Module(
  container.resolve(Service)
));

// main.ts
const module = container.resolve(Module);
```

### Snapshot and Restore

Snapshots allow temporary modifications for unit testing, which can be reverted later.

```ts
container.snapshot();
// Modify bindings
container.restore();
```

## License

This project is licensed under the **MIT License**.

