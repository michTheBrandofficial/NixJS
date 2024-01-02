import { nixixStore } from "../dom";
import { type NonPrimitive } from "./types";

function incrementId(prop: keyof typeof nixixStore) {
  if (nixixStore[prop] === undefined) {
    // @ts-ignore
    nixixStore[prop] = 0;
  } else {
    // @ts-ignore
    nixixStore[prop] = nixixStore[prop] + 1;
  }
  return nixixStore[prop];
}

function entries(obj: object) {
  return Object.entries(obj);
}

function isFunction(val: any) {
  return typeof val === "function";
}

function cloneObject<T extends NonPrimitive>(object: T) {
  return JSON.parse(JSON.stringify(object)) as T;
}

function removeChars(str: string | number) {
  return String(str).replace(/_/g, "");
}

function isNull(val: any) {
  return val === null || val === undefined;
}

function checkType(value: string | number | boolean) {
  const types = {
    boolean: Boolean,
    string: String,
    number: Number,
  };

  const type = types[typeof value as keyof typeof types];
  return type;
}

function isPrimitive(value: any) {
  return (
    ["string", "boolean", "number"].includes(typeof value) || isNull(value)
  );
}

type ForEachParams<T> = Parameters<Array<T>["forEach"]>;

/**
 * Returns void, to be used when you want to mutate some outside code in an array
 */
function forEach<T>(
  arr: Array<T>,
  cb: ForEachParams<T>[0],
  thisArg?: ForEachParams<T>[1]
) {
  arr?.forEach?.(cb, thisArg);
}

export {
  incrementId,
  checkType,
  isNull,
  isPrimitive,
  removeChars,
  cloneObject,
  isFunction,
  entries,
  forEach,
};
