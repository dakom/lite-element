import {html, render} from 'lit-html';
import {makeElement, PropKind, RENDER_MASK_ALL } from "./lib";

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

makeElement({
  name: "my-element",
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
  render: ({fooBar, initialAttr, changedAttr, jsonString, dynamicProp, attrNumber, propNumber, flag, flagString}:any) => {
      return html`
        <div>
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
        </div>
    `
  },
  renderMask: RENDER_MASK_ALL,
  logRenders: true,
});

// Render everything to the page

let App = () => html`
    <main>
        <p><simple-element name="world" value="42"></simple-element></p>
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
    </main>
`;

render(App(), document.body);
const el:any = document.getElementById("mine");

el.setAttribute("changedAttr", "Changed Attribute");
el.dynamicProp = "Dynamic Property";
el.propNumber = 40; 