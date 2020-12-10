import {html, render} from 'lit-html';
import {makeElement, PropKind} from "./lib";

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
      ["flagString", PropKind.Boolean]
  ],
  render: ({fooBar, initialAttr, changedAttr, dynamicProp, attrNumber, propNumber, flag, flagString}:any) => {
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
        </ul>
    `
  }
});

let App = () => html`
    <my-element 
        id="mine" 
        fooBar="Foo"
        initialAttr="Initial Attribute"
        changedAttr="Initial Attribute"
        attrNumber="30"
        flag
        flagString="false"
    >
    </my-element>
`;

render(App(), document.body);

const el = document.getElementById("mine");

el.setAttribute("changedAttr", "Changed Attribute");
el.dynamicProp = "Dynamic Property";
el.propNumber = 40; 