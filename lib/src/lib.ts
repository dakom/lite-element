import {render as litHtmlRender, TemplateResult} from "lit-html";

//Would be great if we could constrain T
//To be a map with the strings in props 
export interface ElementConfig<T> {
  name: string,
  render:(props:T) => TemplateResult,
  props?:Array<RenderProp>,
  renderMask?: number,
  logRenders?: boolean
}

export type RenderProp = string | [string, PropKind];

//Kept as strings to make JS interop easier
export enum PropKind {
  String = "string",
  Number = "number",
  Int = "int",
  Json = "json",
  Boolean = "boolean"
}

//Not used generally except for debugging or niche edge cases
export const RENDER_MASK_CONNECT =              0b000001; //render when connected
export const RENDER_MASK_ADOPT =                0b000010; //render when adopted
export const RENDER_MASK_DISCONNECT =           0b000100; //render when adopted
export const RENDER_MASK_PROPS =                0b001000; //render when props change
export const RENDER_MASK_ATTR =                 0b010000; //render when attributes change
export const RENDER_MASK_DEFER_CHANGE_CONNECT = 0b100000; //do not render prop/attribute changes until connected

//combos
export const RENDER_MASK_CHANGES = RENDER_MASK_PROPS | RENDER_MASK_ATTR;
export const RENDER_MASK_DEFER_CHANGES = RENDER_MASK_DEFER_CHANGE_CONNECT | RENDER_MASK_CHANGES; 
export const RENDER_MASK_ALL = 
  RENDER_MASK_CONNECT
  | RENDER_MASK_ADOPT
  | RENDER_MASK_DISCONNECT
  | RENDER_MASK_PROPS
  | RENDER_MASK_ATTR;

//default
export const DEFAULT_RENDER_MASK = RENDER_MASK_CONNECT | RENDER_MASK_DEFER_CHANGES;

function debugMask(mask:number):Array<string> {
  const list = [];
  if(mask & RENDER_MASK_CONNECT) {
    list.push("connect");
  }
  if(mask & RENDER_MASK_ADOPT) {
    list.push("adopt");
  }
  if(mask & RENDER_MASK_DISCONNECT) {
    list.push("disconnect");
  }
  if(mask & RENDER_MASK_PROPS) {
    list.push("props");
  }
  if(mask & RENDER_MASK_ATTR) {
    list.push("attr");
  }
  if(mask & RENDER_MASK_DEFER_CHANGE_CONNECT) {
    list.push("defer-change-connect");
  }

  return list;
}

// via https://css-tricks.com/creating-a-custom-element-from-scratch/
abstract class LiteElement<T> extends HTMLElement {
  __internalProps:T = {} as T;
  __attributeToPropKind = new Map<String, PropKind>();
  __attributeToPropName = new Map<String, String>();

  __renderMask:number = 0;
  __hasConnected:boolean = false;
  __logRenders:boolean = false;

  static __observedAttributes:Array<string> = [];

  static get observedAttributes() {
    return this.__observedAttributes;
  }

  static pushObservedAttribute(name:string) {
    this.__observedAttributes.push(name);
  }

  constructor({renderMask, props, logRenders}:ElementConfig<T>) {
    super();

    this.__renderMask = renderMask == null ? DEFAULT_RENDER_MASK : renderMask;
    this.__logRenders = logRenders === true ? true : false;

    if(props) {
      this.setupProps(props);
    }
  }

  setupProps(props:Array<RenderProp>) {
    const __internalProps = this.__internalProps as any;
    props.forEach(_prop => {
      const [prop, kind] = deconstructProp(_prop);
        Object.defineProperty(this, prop, {
          get() { 
            return __internalProps[prop]
          },
          set(value) {
            __internalProps[prop] = value; 
            this._renderToSelf(RENDER_MASK_PROPS);
          }
        });

        __internalProps[prop] = getDefaultPropKind(kind);

        this.__attributeToPropName.set(prop.toLowerCase(), prop);
        if(kind) {
          this.__attributeToPropKind.set(prop,kind);
        }
    });
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

      this._renderToSelf(RENDER_MASK_ATTR);
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
    this._renderToSelf(RENDER_MASK_ADOPT);
  }

  connectedCallback() {
    this.__hasConnected = true;
    this._renderToSelf(RENDER_MASK_CONNECT);
  }

  disconnectedCallback() {
    this.__hasConnected = false;
    this._renderToSelf(RENDER_MASK_DISCONNECT);
  }

  _renderToSelf(mask:number) {
    if((mask & RENDER_MASK_CHANGES) && (this.__renderMask & RENDER_MASK_DEFER_CHANGE_CONNECT) && (!this.__hasConnected)) {
      return;
    }
    if(this.__renderMask & mask) {
      if(this.__logRenders) {
        console.log(`rendering: ${debugMask(mask)}`);
      }
      litHtmlRender(this.render(this.__internalProps), this);
    }
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

export function makeElement<T>(config:ElementConfig<T>) {

  if(customElements.get(config.name)) {
    console.warn(`${config.name} is already defined, not re-registering!`);
    return;
  }

  const _class = class extends LiteElement<T> {
    constructor() {
      super(config);
      //setupProps(config.props, this);
    }
    render(props:T) {
      return config.render(props);
    }
  }

  //couldn't figure out how to do this in setup props
  //or the class constructor
  //and the Object.getPrototypeOf thing is weird
  //but whatever, it works!
  if(config.props) {
    const staticRef = Object.getPrototypeOf(_class);
    config.props.forEach(_prop => {
      const [prop,] = deconstructProp(_prop);
      staticRef.pushObservedAttribute(prop.toLowerCase());
    });
  }

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