import { MutableRefObject, Signal } from "./index";

/**
   * 
   * @param bindtype string 'ref' or any other binding
   * @param directiveValue value of the bind type
   * @param element element which binding will happen on.
   */
export function handleDirectives_(bindtype: string, directiveValue: {}, element: Element) {

  if (bindtype === 'ref') {
    if (directiveValue instanceof Signal) {
      errorFunc(`The bind:ref directive's value cannot be a Signalful value, it must be a MutableRefObject.`);
    }
    let refObject: MutableRefObject;

    refObject = directiveValue as MutableRefObject;
    refObject['current'] = element;
    window.addEventListener('DOMContentLoaded', () => {
      parseRef(refObject);
    })
  }

}

export async function parseRef(refObject: MutableRefObject) {
  await Promise.resolve();
  const current = refObject.current as Element;
  refObject.nextElementSibling = current.nextElementSibling;
  refObject.parent = current.parentElement;
  refObject.prevElementSibling = current.previousElementSibling;
  return 'Done!!!';
}

export async function parseSignal(id: number, element: Element, property: any, typeOf: Dependents['typeOf'], oldCallback?: EventListenerObject) {
  await Promise.resolve();
  const key = `_${id}_`;
  if (typeOf === 'DOMProp') {
    window.SignalStore[key].dependents.push(
      { element, property, typeOf, oldCallback }
    )
  } else {
    window.SignalStore[key].dependents.push(
      { element, property, typeOf }
    );
  }

  return 'Done!!!';
}

/**
 * @param id is the id which diffSignal_ will use to get the Signal object in window.SignalStore
 * diffSignal_ is not async because it will be passed to window['diffSignal'], it is defined here for the sake of simplicity of index.ts
 * on, aria, and bind has been parsed with Signal
 */
export async function diffSignal_(id: number) {

  await Promise.resolve();
  const { value, dependents } = window.SignalStore[`_${id}_`];
  dependents.forEach((dependent) => {
    const { typeOf, element, property } = dependent;
    if (typeOf === 'AriaProp') {
      element.setAttribute(`aria-${property}`, value);
    } else if (typeOf === 'className') {
      element.setAttribute('class', value);
    } else if (typeOf === 'regularAttribute') {
      element.setAttribute(property, value);
    } else if (typeOf === 'styleProp') {
      (element as HTMLElement)['style'][property] = value;
    } else if (typeOf === 'DOMProp') {
      (element as HTMLElement).removeEventListener(property, dependent.oldCallback as EventListenerObject);
      (element as HTMLElement).addEventListener(property, value);
    } else if (typeOf === 'childTextNode') {
      element.childNodes[property].textContent = value;
    }

  });

}

export function errorFunc(message: string, caller = 'Nixix.create.caller.name') {
  throw(`${message} @${eval(caller)}`);
}