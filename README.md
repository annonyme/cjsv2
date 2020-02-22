# cJSv2
cJSv2 is a simple JavaScript MVC-Framework for training purposes. It demonstrats in a simple way the usage of:

* Selecting HTML-elements with specific attribute (QuerySelector)
* Eventhandling for automatic value-binding
* The JavaScript Proxy-implementation for automatic two-way value-binding
* Binding events of elements to controller-methods
* Injecting singleton services to controllers 

The framework is very lightweight (**less than 500 lines of code**) and needs no dependencies or compiling-environments. The Framework has no real templating-engine, you can only bind values to the text-content of HTML-elements like _span_ or _i_.

It is inspired by AngularJS, Vue.js and a little bit by JavaFX.

---

Integrates fine with https://github.com/json-editor/json-editor for form-generation

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

### Using Templates

```
function Example(){
    this.value=0;
    
    this.template = '<div><input type="button" value="add +1" cjs-binding-event="click:add"/></div>';
    
    this.add=function(event){
        this.value++;
        console.log("Example add +1: "+this.value);
    };
    
    this.init = function() {
        doc = new DOMParser().parseFromString(this.template, "text/html");                    
        cjs.findEventBindings(this.cJSParentWrapper, doc);
        let element = document.getElementById("button");			
        let copy = doc.firstChild;			
        element.appendChild(copy);
    }
}
```

```
<div cjs-controller="test:Example:init">
    <input type="number" value="0" cjs-binding-value="value"/>
    <div id="button"></div>
</div>
```

### Register a component and include it into the DOM
```
let component = {
    name: "component",
    controller: {
        value: 0
    },
    initMethod: null,
    template: "<div>Hello I am a Component! (<span cjs-binding-value=\"value\"></span>)</div>"            
};

function Main(){
    this.cJSElement;   

    this.click = function(){
        this.cjsGetController("component").value++;
    };

    this.init=function(){
        cjs.registerComponentObject(component);
        this.cJSElement.appendChild(this.cjsGetController("component").cJSElement);
    }
}
```

```
<div cjs-controller="main:Main:init">
</div>
```

### Using a service by injection
```
function AddService() {
    this.addTwo = function(val) {
        return val + 2;
    }
}

function Example(){
    this.value=0;

    this.add=function(event){
        this.value = this.AddService.addTwo(this.value);
        console.log("Example add +2: "+this.value);
    };
}
```

```
<div cjs-controller="test:Example" cjs-services="AddService">
    <input type="number" value="0" cjs-binding-value="value"/>
    <input type="button" value="add +2" cjs-binding-event="click:add"/>
</div>
```

### Using a service by injection with different fieldname
```
function AddService() {
    this.addTwo = function(val) {
        return val + 2;
    }
}

function Example(){
    this.value=0;

    this.add=function(event){
        this.value = this.addy.addTwo(this.value);
        console.log("Example add +2: "+this.value);
    };
}
```

```
<div cjs-controller="test:Example" cjs-services="AddService:addy">
    <input type="number" value="0" cjs-binding-value="value"/>
    <input type="button" value="add +2" cjs-binding-event="click:add"/>
</div>
```

### Implementing a Event-Bus with a service
```
function EventBus() {
    this.services = [];
    
    this.register=function(event, callback){
        if(!this.services[event]) {
            this.services[event] = [];
        }
        this.services[event].push(callback);
    }

    this.fire=function(event, payload){
        if(this.services[event]) {
            this.services[event].forEach(subscriber => {
                subscriber(payload);
            })
        }
    }
}

function Receiver(){
    this.value="";

    this.init=function(){                
        this.EventBus.register("update", (payload) => {
            this.value = payload.value;
        });
        this.cjsPushBindings();
    };
}

function Sender(){
    this.values=[
        'Blubb',
        'Test',
        'Brumm',
        'Event',
        'Something'
    ];

    this.send=function(event){
        this.EventBus.fire("update", {value: this.values[Math.floor(Math.random() * this.values.length)]})
    };
}
```

```
<div cjs-controller="sender:Sender:init" cjs-services="EventBus">
    <input type="button" value="fire event" cjs-binding-event="click:send"/>
</div>
<div cjs-controller="receiver:Receiver:init" cjs-services="EventBus">
    <input type="text" value="" cjs-binding-value="value"/>
</div>
```