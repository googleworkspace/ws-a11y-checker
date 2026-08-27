/**
 * Mock for @angular/core in Node.js Jest test environment.
 */
export function Injectable(options?: any) {
  return function (target: any) {
    return target;
  };
}

export function signal<T>(initialValue: T) {
  let val = initialValue;
  const getter = () => val;
  getter.set = (newVal: T) => { val = newVal; };
  getter.update = (fn: (current: T) => T) => { val = fn(val); };
  getter.asReadonly = () => getter;
  return getter;
}

export function computed<T>(fn: () => T) {
  return () => fn();
}

export type Signal<T> = () => T;
