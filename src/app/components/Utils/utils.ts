/**
 * This File contains helper functions
 */

/**
 * @description Nicer and handy way of settimeout
 * @param time Time in milliseconds
 */
export const wait = (time: number): Promise<any> =>
  new Promise((res) => setTimeout(res, time));

/**
 * @description Creates a duplicate-free version of an array
 * @param array array to inspect
 * @param comparator comparator
 *
 * @returns returns the new duplicate free array
 */
export const uniqBy = (array: any[], comparator: string): any[] =>
  array.filter(
    (value, index, self) =>
      self.findIndex((m) => m[comparator] === value[comparator]) === index
  );

/* 
  encoder for httpParams
  */
export const encoder = {
  encodeKey(key: string): string {
    return encodeURIComponent(key);
  },

  encodeValue(value: string): string {
    return encodeURIComponent(value);
  },

  decodeKey(key: string): string {
    return decodeURIComponent(key);
  },

  decodeValue(value: string): string {
    return decodeURIComponent(value);
  },
};
