# LiteElement

```
npm install --save lite-element
```

A _very_ basic barebones web component helper that uses `lit-html`.

It's not framework and it deliberately makes none of the optimizations `lit-element` does.

The use-case here is more like "reactive custom elements" than full-fledged components and the intent is for usage within other frameworks. Here's some features it does NOT have:

* No async rendering on changes
* No Shadow DOM
* No reverse-mapping of Attributes to properties
* No decorators, additional lifecycle methods, etc.
* Only a single function (no exported classes to override/extend)

That said, it's _very_ tiny (~1K gzipped w/o lit-html), fast, and makes custom elements a breeze.

Here's some features it DOES have:

* Customizable options to control when it renders
* React to changes (using lit-html for fast rendering)
* Merging of properties and attributes (reacts to both, preserves camelCasing for callback) 
* Specify a conversion type from attributes (which html requires be set as a string) 
* Define your component with a single function call

### Example

_Both of the following examples are also in the [demo](demo/) (which you can spin up for a local playground)._

1. In a library somewhere to define your custom elements:
```

import {html} from 'lit-html';
import {makeElement, PropKind} from "lite-element";

interface Props {
    name: string,
    value: number
}
makeElement({
  name: "simple-element",
  props: ["name", ["value", PropKind.Number]],
  render: ({name, value}:Props) => html`
    <div>
        hello ${name} (that's a ${typeof name})! 
        value is ${value} (that's a ${typeof value}).
    </div>
  `
});
```

2. In your rendered html:

```
<simple-element name="world" value="42" />
```

3. Result:
```
hello world (that's a string)! value is 42 (that's a number).
```

### Another example


```
makeElement({
//Name the custom element

  name: "my-element",

//Specify the props we want to react to
//Works with both attribtutes and js properties
//Either set a string or a tuple of [string, PropKind]
//The tuple version is used for converting attributes
//To a property type of non-string
//Note that "propNumber" doesn't need this because
//it is set as a js property directly

  props: [
      "fooBar", 
      "initialAttr", 
      "changedAttr", 
      "dynamicProp",
      ["attrNumber", PropKind.Number],
      "propNumber",
      ["flag", PropKind.Boolean],
      ["flagString", PropKind.Boolean],
      ["jsonString", PropKind.Json],
  ],

//The render function. It simply gets back the current props
//Must return a lit-html Template result (e.g. html`...`)

  render: ({fooBar, initialAttr, changedAttr, dynamicProp, attrNumber, propNumber, flag, flagString, jsonString}:any) => {
      return html`
        <ul>
            <li>foo: ${fooBar}</li>
            <li>initialAttr: ${initialAttr}</li>
            <li>changedAttr: ${changedAttr}</li>
            <li>dynamicProp: ${dynamicProp}</li>
            <li>attrNumber: ${attrNumber + 2}</li>
            <li>propNumber: ${propNumber + 2}</li>
            <li>flag: ${flag ? "yes" : "no"}</li>
            <li>flagString: ${flagString ? "yes" : "no"}</li>
            <li>jsonString via attr: ${jsonString}</li>
            <li>json roundtrip: ${JSON.stringify(jsonString)}</li>
        </ul>
    `
  }
});
```

After calling that, the element will be available everywhere, and can be used like any other element:

```

// Render it out also with lit-html
let App = () => html`
    <my-element 
        id="mine" 
        fooBar="Foo"
        initialAttr="Initial Attribute"
        changedAttr="Initial Attribute"
        attrNumber="30"
        flag
        flagString="false"
        jsonString='{"hello": "world"}'
    >
    </my-element>
`;

render(App(), document.body);

// Get access to update stuff
const el = document.getElementById("mine");

// Change things
el.setAttribute("changedAttr", "Changed Attribute");
el.dynamicProp = "Dynamic Property";
el.propNumber = 40; 
```

The end result of all the above will be a page like this:

```

* foo: Foo
* initialAttr: Initial Attribute
* changedAttr: Changed Attribute
* dynamicProp: Dynamic Property
* attrNumber: 32
* propNumber: 42
* flag: yes
* flagString: no
* jsonString via attr: [object Object]
* json roundtrip: {"hello":"world"}
```

You can also supply a `renderMask` to control when it renders and `logRenders` for debugging

See [the source](lib/src/lib.ts) for more details 