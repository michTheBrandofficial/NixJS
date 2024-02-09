import { Signal } from "../primitives/classes";
import { isFunction } from "../primitives/helpers";
import { callEffect, removeEffect } from "../primitives/index";
import Component from "./Component";
import {
  addChildren,
  checkDataType,
  entries,
  getSignalValue,
  handleDirectives_,
  isNull,
  isReactiveValue,
  raise,
  warn,
} from "./helpers";
import { PROP_ALIASES, SVG_ELEMENTTAGS, SVG_NAMESPACE } from "./utilVars";

type GlobalStore = {
  commentForLF: boolean;
  viewTransitions?: boolean;
  $$__routeStore?: {
    errorPage?: {
      errorRoute: string;
    };
    [path: string]: string | Node | (string | Node)[] | any;
  };
  root?: Element;
  /**
   * this prop is for stores to be patched efficiiently
   */
  reactiveScope: boolean;
};

export const nixixStore = { commentForLF: false, reactiveScope: true } as GlobalStore;

function removeNode(node: Element | Text) {
  const isConnected = node?.isConnected;
  if (isConnected) node?.remove?.();
  node?.dispatchEvent?.(new Event("remove:node"));
  node?.childNodes?.forEach?.((child) => removeNode(child as any));
  return isConnected;
}

async function doBGWork(fn: CallableFunction) {
  await Promise.resolve();
  fn();
}

function setAttribute(
  element: NixixElementType,
  attrName: string,
  attrValue: ValueType,
  type?: TypeOf
) {
  if (isNull(attrValue))
    return warn(
      `The ${attrName} prop cannot be null or undefined. Skipping attribute parsing.`
    );
  // signal check
  if ((attrValue as Signal).$$__reactive) {
    // @ts-expect-error
    function propEff() {
      type === "propertyAttribute"
        ? // @ts-ignore
          (element[attrName] = getSignalValue(attrValue))
        : element.setAttribute(
            attrName,
            getSignalValue(attrValue as any) as any
          );
    }
    element.addEventListener("remove:node", function removeRxn(e) {
      // remove the effect;
      removeEffect(propEff, attrValue as any);
      e.currentTarget?.removeEventListener?.("remove:node", removeRxn);
    });
    callEffect(propEff, [attrValue as any]);
  } else if (checkDataType(attrValue)) {
    type === "propertyAttribute"
      ? // @ts-ignore
        (element[attrName] = attrValue)
      : element.setAttribute(attrName, attrValue as any);
  }
}

function setStyle(element: NixixElementType, styleValue: StyleValueType) {
  if (isNull(styleValue))
    return warn(
      `The style prop cannot be null or undefined. Skipping attribute parsing.`
    );
  const cssStyleProperties = entries(styleValue) as [string, ValueType][];
  for (let [property, value] of cssStyleProperties) {
    // typed as display to remove the ts error
    let styleKey = property as "display";
    if (isNull(value)) {
      warn(
        `The ${styleKey} CSS property cannot be null or undefined. Skipping CSS property parsing.`
      );
      continue;
    }

    // signal check
    if ((value as Signal).$$__reactive) {
      // @ts-expect-error
      function styleEff() {
        element["style"][styleKey] = getSignalValue(value as any) as any;
      }
      element.addEventListener("remove:node", function removeRxn(e) {
        // remove the effect;
        removeEffect(styleEff, value as any);
        e.currentTarget?.removeEventListener?.("remove:node", removeRxn);
      });
      callEffect(styleEff, [value as any]);
    } else {
      element["style"][styleKey] = value as string;
    }
  }
}

function setProps(props: Proptype | null, element: NixixElementType) {
  if (props) {
    props = Object.entries(props);
    for (const [k, v] of props as [string, StyleValueType | ValueType][]) {
      if (k in PROP_ALIASES) {
        const mayBeClass = PROP_ALIASES[k]["$"];
        setAttribute(
          element,
          mayBeClass === "className" ? "class" : mayBeClass,
          v as ValueType,
          mayBeClass === "className" ? "regularAttribute" : "propertyAttribute"
        );
      } else if (k === "style") {
        setStyle(element, v as unknown as StyleValueType);
      } else if (k.startsWith("on:")) {
        if (isNull(v))
          return warn(
            `The ${k} prop cannot be null or undefined. Skipping prop parsing`
          );
        isReactiveValue(v as any, k);
        const domAttribute = k.slice(3);
        element.addEventListener(domAttribute, v as any);
      } else if (k.startsWith("aria:")) {
        Nixix.handleDynamicAttrs({
          element,
          attrPrefix: "aria:",
          attrName: k,
          attrValue: v as ValueType,
        });
      } else if (k.startsWith("stroke:")) {
        Nixix.handleDynamicAttrs({
          element,
          attrPrefix: "stroke:",
          attrName: k,
          attrValue: v as ValueType,
        });
      } else if (k.startsWith("bind:")) {
        if (isNull(v))
          return raise(
            `The ${k} directive value cannot be null or undefined. Skipping directive parsing`
          );
        isReactiveValue(v as any, k);
        Nixix.handleDirectives(
          k.slice(5),
          v as unknown as MutableRefObject,
          element
        );
      } else {
        setAttribute(element, k, v as ValueType);
      }
    }
  }
}

function setChildren(children: ChildrenType | null, element: NixixElementType) {
  if (children != undefined || children != null) {
    addChildren(children, element);
  }
}

function buildComponent(
  tagNameFC: target,
  props: Proptype,
  children: ChildrenType
) {
  let returnedElement: any = null;
  if (isFunction(tagNameFC)) {
    const artificialProps = props || {};
    Boolean(children?.length) && (artificialProps.children = children);
    if (Object.getPrototypeOf(tagNameFC) === Component) {
      const componentObject = new (tagNameFC as any)(
        artificialProps
      ) as Component;
      if (Object.getPrototypeOf(componentObject).jsx)
        returnedElement = (componentObject as any).jsx(artificialProps);
      else {
        raise(
          `Specify a ` +
            "`jsx` method in your " +
            `<${(tagNameFC as any).name}> class Component`
        );
      }
    } else {
      try {
        returnedElement = (tagNameFC as Function)(artificialProps);
      } catch (error) {
        throw new Error(error as any);
      }
    }
  }
  return returnedElement;
}

function render(
  fn: () => NixixNode | NixixNode,
  root: HTMLElement,
  config: {
    commentForLF: boolean;
  } = { commentForLF: true }
) {
  let bool = isFunction(fn);
  if (!bool)
    warn(
      `You may not get top level reacitivity. Wrap your jsx element in a function like so: () => <View />`
    );
  nixixStore.commentForLF = config.commentForLF;
  addChildren((bool ? fn() : fn) as any, root);
  doBGWork(() => (nixixStore["root"] = root));
}

const Nixix = {
  create: function (
    tagNameFC: target,
    props: Proptype,
    ...children: ChildrenType
  ): Element | Array<Element | string | Signal> | undefined {
    let returnedElement: any = null;
    if (typeof tagNameFC === "string") {
      if (tagNameFC === "fragment") {
        if (children !== null) returnedElement = children;
        else returnedElement = [];
      } else {
        const element = !SVG_ELEMENTTAGS.includes(tagNameFC)
          ? document.createElement(tagNameFC)
          : document.createElementNS(SVG_NAMESPACE, tagNameFC);
        setProps(props, element);
        setChildren(children, element);
        returnedElement = element;
      }
    } else returnedElement = buildComponent(tagNameFC, props, children);
    return returnedElement;
  },
  handleDirectives: handleDirectives_,
  handleDynamicAttrs: ({
    element,
    attrPrefix,
    attrName,
    attrValue,
  }: DynamicAttrType) => {
    const attrSuffix = attrName.slice(attrPrefix.length);
    const newAttrName = `${attrPrefix.replace(":", "-")}${attrSuffix}`;
    setAttribute(element, newAttrName, attrValue);
  },
};

const create = Nixix.create;

export default Nixix;
export { Component, buildComponent, create, removeNode, render, setAttribute };
