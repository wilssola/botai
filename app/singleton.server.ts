/**
 * Singleton function to ensure a single instance of a value.
 * @param {string} name - The name of the singleton instance.
 * @param {() => Value} valueFactory - A factory function to create the value.
 * @returns {Value} The singleton instance of the value.
 * @template Value - The type of the value.
 * @see https://github.com/jenseng/abuse-the-platform/blob/2993a7e846c95ace693ce61626fa072174c8d9c7/app/utils/singleton.ts
 */
export const singleton = <Value>(
  name: string,
  valueFactory: () => Value
): Value => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = global as any;
  g.__singletons ??= {};
  g.__singletons[name] ??= valueFactory();
  return g.__singletons[name];
};
