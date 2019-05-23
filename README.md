# cJSv2
cJSv2 is a simple JavaScript MVC-Framework for training purposes. It demonstrats in a simple way the usage of:

* Selecting HTML-elements with specific attribute (QuerySelector)
* Eventhandling for automatic value-binding
* The JavaScript Proxy-implementation for automatic two-way value-bindung
* Binding events of elements to controller-methods

The framework is very lightweight and needs no dependencies or compiling-environments. The Framework has no real templating-engine, you can only bind values to the text-content of HTML-elements like _span_ or _i_.

It is inspired by AngularJS, Vue.js (till V2) and a little bit by JavaFX.

---

## Examples

### Simple Controller

```
function Controller(){
    this.value = 0;
}
```

```
<div cjs-controller="mycontroller:Controller">
</div>
```

### Simple Controller with init-function

```
function Controller(){
    this.value = 0;

    this.myInit = function(){
        this.value = 23;
    }
}
```

```
<div cjs-controller="mycontroller:Controller:myInit">
</div>
```

### Value Binding (Input)

```
function Controller(){
    this.value = 0;
}
```

```
<div cjs-controller="mycontroller:Controller">
    <input cjs-binding-value="value" type="text"/>
</div>
```

### Value Binding (Output)

```
function Controller(){
    this.value = 0;
}
```

```
<div cjs-controller="mycontroller:Controller">
    <span cjs-binding-value="value"></span>
</div>
```

### Element Binding

```
function Controller(){
    this.myElement;

    this.do = function(event){
        this.myElement.appendChild(document.createTextNode("clicked!"));
    }
}
```

```
<div cjs-controller="mycontroller:Controller">
    <div cjs-binding-element="myElement"></div>
</div>
```

### Event Binding

```
function Controller(){
    this.myElement;

    this.do = function(event){
        this.myElement.appendChild(document.createTextNode("clicked!"));
    }
}
```

```
<div cjs-controller="mycontroller:Controller">
    <div cjs-binding-element="myElement"></div><br/>
    <button cjs-binding-event="click:do">click me!</button>
</div>
```
