import {render as litHtmlRender, TemplateResult} from "lit-html";

//Would be great if we could constrain T
//To be a map with the strings in props 
export interface ElementConfig<T> {
  props:Array<RenderProp>,
  render:(props:T) => TemplateResult,
  name: string,
  renderMode?: RenderMode,
}

export type RenderProp = string | [string, PropKind];

export enum PropKind {
  String = "string",
  Number = "number",
  Int = "int",
  Json = "json",
  Boolean = "boolean"
}

export enum RenderMode {
  Immediate = "immediate",
  DeferInit = "deferInit",
  //Async - TODO
}

const DEFAULT_RENDERING_MODE = RenderMode.DeferInit;

// via https://css-tricks.com/creating-a-custom-element-from-scratch/
abstract class LiteElement<T> extends HTMLElement {
  __internalProps:T = {} as T;
  __attributeToPropKind = new Map<String, PropKind>();
  __attributeToPropName = new Map<String, String>();

  __deferInitialRender = false;

  static __observedAttributes:Array<string> = [];

  static get observedAttributes() {
    return this.__observedAttributes;
  }

  static pushObservedAttribute(name:string) {
    this.__observedAttributes.push(name);
  }

  constructor({renderMode}:{renderMode: RenderMode}) {
    super();

    this.__deferInitialRender = renderMode == RenderMode.DeferInit ? true : false;

    /* Create a property name for each attribute
      Such that changing the property sets the attribute 
      Disabled because we really want that _everything_
      Is just a property, and attributes change the properties 

      We could support both but it's annoying :P
    */
    /*
      const {observedAttributes} = this.constructor as any;

      if (observedAttributes && observedAttributes.length) {
        observedAttributes.forEach((attribute:string) => {
          Object.defineProperty(this, attribute, {
            get() { 
              return this.getAttribute(attribute); 
            },
            set(attrValue) {
              if (attrValue) {
                this.setAttribute(attribute, attrValue);
              } else {
                this.removeAttribute(attribute);
              }
              this._renderToSelf();
            }
          });
        });
      }
      */
  }

  //When attributes change (and the first time)
  //set them on the corresponding property
  //Using the conversion method if it exists
  attributeChangedCallback(_attrName:string, oldValue:string, newValue:string) {
    let attrName = this.__attributeToPropName.get(_attrName) as string;
    if(attrName == null) {
      attrName = _attrName;
    }
    //console.log(attrName, oldValue, newValue);
    if (newValue !== oldValue) {
      const kind:PropKind | undefined = this.__attributeToPropKind.get(attrName);
      (this as any).__internalProps[attrName] = !kind || kind === PropKind.String
        ? newValue
        : this.convertAttributeToProperty(kind, attrName, newValue);

      if(!this.__deferInitialRender) {
        this._renderToSelf();
      }
    }
  }

  convertAttributeToProperty(propertyKind:PropKind, attrName:string, value:string) {
    switch(propertyKind) {
      case PropKind.String: return value;
      case PropKind.Boolean: {
          if(typeof value === "string") {
            return value.toLowerCase() !== "false"
          } else {
            return this.hasAttribute(attrName)
          }
      }
      case PropKind.Int: return parseInt(value);
      case PropKind.Number: return parseFloat(value);
      case PropKind.Json: return JSON.parse(value);
      default: {
        console.warn(`unknown property kind: ${propertyKind}`);
        return null;
      }
    }
  }


  adoptedCallback() {
    //this._renderToSelf();
  }
  connectedCallback() {
    //this.__deferInitialRender = false;
    //this._renderToSelf();
  }

  _renderToSelf() {
    litHtmlRender(this.render(this.__internalProps), this);
  }
  abstract render(props:T):TemplateResult
}


const deconstructProp = (_prop: RenderProp):[string, PropKind | null] => 
  typeof _prop === "string" 
    ? [_prop, null]
    : [_prop[0], _prop[1]];

const getDefaultPropKind = (propertyKind:PropKind | null):any => {
    switch(propertyKind) {
      case PropKind.String: return "";
      case PropKind.Boolean: return false;
      case PropKind.Int: return 0; 
      case PropKind.Number: return 0.0; 
      case PropKind.Json: return {}; 
      case null: return "";
      default: {
        console.warn(`unknown property kind: ${propertyKind}`);
        return null;
      }
    }
}

const setupProps = <T>(props:Array<RenderProp>, target:LiteElement<T>) => {
  const __internalProps = target.__internalProps as any;
  props.forEach(_prop => {
    const [prop, kind] = deconstructProp(_prop);
      Object.defineProperty(target, prop, {
        get() { 
          return __internalProps[prop]
        },
        set(value) {
          __internalProps[prop] = value; 
          target._renderToSelf();
        }
      });

      __internalProps[prop] = getDefaultPropKind(kind);

      target.__attributeToPropName.set(prop.toLowerCase(), prop);
      if(kind) {
        target.__attributeToPropKind.set(prop,kind);
      }
  });
}
export function makeElement<T>(config:ElementConfig<T>) {

  if(customElements.get(config.name)) {
    console.warn(`${config.name} is already defined, not re-registering!`);
    return;
  }

  const _class = class extends LiteElement<T> {
    constructor() {
      super({
        renderMode: config.renderMode == null ? DEFAULT_RENDERING_MODE : config.renderMode 
      });
      setupProps(config.props, this);
    }
    render(props:T) {
      return config.render(props);
    }
  }

  //couldn't figure out how to do this in setup props
  //and the Object.getPrototypeOf thing is weird
  //but whatever, it works!
  config.props.forEach(_prop => {
    const [prop,] = deconstructProp(_prop);
    Object.getPrototypeOf(_class).pushObservedAttribute(prop.toLowerCase());
  });

  customElements.define(config.name, _class);
}

//Example
/*
makeElement({
  props: ["name", "value", ["checked", PropKind.Boolean]],
  name: "my-element",
  render: () => html`<div>hello world</div>`
});
*/