import type { IToken } from './types';

/**
 * Represents a unique token with a name and optional value.
 */
class Token<T> implements IToken<T> {
  type: symbol; // Immutable, unique identifier for the token
  value: T = undefined as T;

  constructor(name: string) {
    this.type = Symbol(name);
  }

  /**
   * Returns the string representation of the token's identifier.
   */
  toString() {
    return this.type.toString();
  }
}

/**
 * Factory function to create a new token.
 * @param name - A unique name for the token.
 * @returns A new token instance.
 */
export const createToken = <T>(name: string) => new Token(name) as IToken<T>;
