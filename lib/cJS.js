// ---------------------------------------------------------------------------
//					cJSv2 0.1.0 - by hp@hannespries.de
// ---------------------------------------------------------------------------

function cJS(){
	this.controllers=[];
	
	//--------- Util Methods ---------------				
	
	this.removeAllChildrenFromElement=function(element){			
		while(element.childNodes.length>0){
			element.removeChild(element.firstChild);
		}
		return element;
	};
	
	this.setInnerTextOfElement=function(element,text){
		this.removeAllChildrenFromElement(element);
		element.appendChild(document.createTextNode(text));
		return element;
	};				
	
	//--------- Modules with require.js ------
	
	this.isRequireJSSupported=function(){
		return typeof require == 'function';
	};
	
	this.getModule=function(moduleName,callBackFunc){
		if(typeof require == 'function'){
			try{
				require([""+moduleName],callBackFunc);
			}
			catch(e){
				console.log("ERROR: can not find require module '"+moduleName+"'");
			}
		}
		else{
			callBackFunc(null);
		}					
	};				

	
	//--------- Controllers/Databinding ------

	this.defaultProxyHandler = {
		set: function(target, property, value, receiver) {
			//console.log("new value for '" + property + "': " + value);
			target[property] = value;
			target.cjsPushBinding(property);

			/**
			 * A watcher
			 * {fieldname: "", handler: (target, property, value) => {}}
			 * 
			 * init watcher-array in controller-init-method
			 */
			if(target.watchers && Array.isArray(target.watchers) && target.watchers.length > 0){
				target.watchers.forEach((watcher) => {
					if(watcher.fieldname == property){
						watcher.handler(target, property, value);
					}
				});
			}
		}	
	};
	
	this.addController = function(name, controller, containingElement, initMethod){
		let wrapper = {
			instance: new Proxy(controller, this.defaultProxyHandler),

			name: name,
			valueBindings: []
		}
		
		controller.cJSName = name;
		controller.watchers = [];
		controller.cJSElement = containingElement;
		
		if(containingElement!=null){
			wrapper=this.findEventBindings(wrapper,containingElement);
			wrapper=this.findValueBindings(wrapper,containingElement);
			wrapper=this.findElementBindings(wrapper,containingElement);
		}	

		var push=function(name){
			return function(){
				cjs.pushBindings(name);
			};
		};
			
		var pull=function(name){
			return function(){
				cjs.pullBindings(name);
			};
		};

		var pushField=function(name){
			return function(fieldName){
				cjs.pushBindings(name, fieldName);
			};
		};
			
		var pullField=function(name){
			return function(fieldName){
				cjs.pullBindings(name, fieldName);
			};
		};
			
		var get = function(name){
			return cjs.getController(name);
		};
			
		var reqModule = function(moduleName,callBackFunc){
			cjs.getModule(moduleName, callBackFunc);
		};

		let addWatcher = function(name){
			return function(fieldname, handler){
				cjs.getController(name).watchers[cjs.getController(name).watchers.length] = {
					fieldName: fieldname,
					handler: handler
				};
			}
		}
			
		controller.cjsPushBindings = push(name);
		controller.cjsPullBindings = pull(name);
		controller.cjsPushBinding = pushField(name);
		controller.cjsPullBinding = pullField(name);
		controller.cjsGetController = get;
		controller.cjsGetModule = reqModule;
		controller.cjsAddWatcher = addWatcher(name);
		
		this.controllers[name]=wrapper;
		console.log("add controller '"+name+"'");
		
		if(initMethod!=null && initMethod.length>0 && wrapper.instance[initMethod]){
			console.log("call init: "+initMethod);
			wrapper.instance[initMethod]();
		}
	};
	
	this.getController = function(name){
		return this.controllers[name] ? this.controllers[name].instance : null;
	};
	
	this.init = function(){
		//find all elements with controller-attribute
		let elements = document.querySelectorAll("[cjs-controller]");
		elements.forEach((element) => {
			let attr = element.getAttribute("cjs-controller");
			console.log("found controller -> "+attr);	
			let parts = attr.split(":");
			
			if(window[parts[1]]){
				let controller = new window[parts[1]]();
				
				let init = null;
				if(parts.length==3 && parts[2]){
					init = parts[2];
				}
				this.addController(parts[0], controller, element, init);
			}
			else{
				console.log("ERROR: can not find controller for '"+parts[0]+"'");
			}
		});
		
		if(this.isRequireJSSupported()){
			elements = document.querySelectorAll("[cjs-require-controller]");
			
            elements.forEach((element) => {
				let attr = element.getAttribute("cjs-require-controller");
				console.log("found controller -> "+attr);	
				let parts = attr.split(":");
				
				let init = null;
				if(parts.length == 3 && parts[2]){
					init = parts[2];
				}
				
				let func=function(cjsObj, name, className, contrElement, initMethod){
					return function(module){
						try{
							if(module != null){
								cjsObj.addController(name, module, contrElement, initMethod);
							}
							else{
								console.log("ERROR: require-module controller '" + name + "' can not be found.");
							}										
						}
						catch(e){
							console.log(e);
						}
					};
				};
				this.getModule(parts[1], func(this, parts[0], parts[1], element, init));
			});
		}
	};
	
	this.findEventBindings = function(controllerWrapper,containingElement){
		let elements=containingElement.querySelectorAll("[cjs-binding-event]");

		elements.forEach((element) => {
			let bindings=element.getAttribute("cjs-binding-event").split(";");
			bindings.forEach((binding) => {
				let parts=binding.split(":");							
				let func=function (controller,method){
					return function(event){
						return controller[method](event);
					};
				};							
				element.addEventListener(parts[0],func(controllerWrapper.instance,parts[1]),false);
				console.log("["+controllerWrapper.name+"] add event binding '"+parts[0]+"' to element "+element.nodeName);
			});
		});
		return controllerWrapper;
	};

	this.onchangeHandler = function(controller, fieldName){
		return function(event){
			//console.log("onchange " + event.target.value + " for " + fieldName);
			controller.cjsPullBinding(fieldName);
		}
	};
	
	this.findValueBindings=function(controllerWrapper,containingElement){
		let elements=containingElement.querySelectorAll("[cjs-binding-value]");
		for(var i=0;i<elements.length;i++){
			let element=elements[i];
			let valueName=element.getAttribute("cjs-binding-value");
			
			let type="text"; //enable types like 'text', 'checked', default is 'text' (pull only on 'text' and 'checked')
			if(valueName.match(/:/)){
				var parts=valueName.split(";");
				type=parts[1];
				valueName=parts[0];
			}
			else{
				//if not defined.. check if value as attribute is existing
				if(element["value"] || element.value || element.nodeName.toLowerCase()=="input" || element.nodeName.toLowerCase()=="select" || element.nodeName.toLowerCase()=="textarea"){
					type="value";
				}
			}

			let wrapper = {
				name: valueName,
				elements: [],
				index: -1
			};
			for(var i = 0; i < controllerWrapper.valueBindings.length; i++){
				if(controllerWrapper.valueBindings[i].name == valueName){
					wrapper = controllerWrapper.valueBindings[i];
					wrapper.index = i;
				}
			}

			wrapper.elements[wrapper.elements.length] = {
				element: element,
				type: type
			};

			if(wrapper.index > -1){
				controllerWrapper.valueBindings[wrapper.index]=wrapper;
			}
			else{
				controllerWrapper.valueBindings[controllerWrapper.valueBindings.length]=wrapper;
			}
			console.log("["+controllerWrapper.name+"] add value-binding["+type+"] '"+valueName+"' to element "+element.nodeName);

			//onchange handler to auto-sync value changes
			if(type == "value"){
				element.addEventListener('change', this.onchangeHandler(controllerWrapper.instance, wrapper.name));
				if(element.nodeName.toLowerCase == "textarea" || element.getAttribute("type") == "text" || element.getAttribute("type") == "number" || element.getAttribute("type") == "email"){
					element.addEventListener('keyup', this.onchangeHandler(controllerWrapper.instance, wrapper.name));
				}							
			}						 
		}
		return controllerWrapper;
	};
	
	this.findElementBindings=function(controllerWrapper,containingElement){
		let elements=containingElement.querySelectorAll("[cjs-binding-element]");
		elements.forEach((element) => {
			let valueName=element.getAttribute("cjs-binding-element");
			controllerWrapper.instance[valueName]=element; //set element to controller-field
			console.log("["+controllerWrapper.name+"] add element-binding '"+valueName+"' for element "+element.nodeName);
		});
		return controllerWrapper;
	};
	
	this.pushBindings=function(name, fieldName){
		if(this.controllers[name]){
			let wrapper=this.controllers[name];
			let bindings=wrapper.valueBindings;						
			//console.log("found controller '"+wrapper.name+"' ("+wrapper.valueBindings.length+")");						
			bindings.forEach((binding) => {
				if(binding.name == fieldName || !fieldName){								
					binding.elements.forEach((element) => {
						console.log("push '"+binding.name+"' to "+element.element.nodeName+" ("+element.type+")");
						if(element.type=="value"){
							element.element.value=wrapper.instance[binding.name];								
						}
						else{
							this.setInnerTextOfElement(element.element, wrapper.instance[binding.name]);
						}
					});	
				}
			});						
		}
	};
	
	this.pullBindings=function(name, fieldName){
		if(this.controllers[name]){
			let wrapper=this.controllers[name];
			let bindings=wrapper.valueBindings;						
			//console.log("found controller '"+wrapper.name+"' ("+wrapper.valueBindings.length+")");	
			bindings.forEach((binding) => {
				if(binding.name == fieldName || !fieldName){
					binding.elements.forEach((element) => {
						if(element.type=="value"){
							console.log("pull '"+binding.name+"' from "+element.element.nodeName+" ("+element.type+")");
							wrapper.instance[binding.name]=element.element.value;
						}
					});
				}
			});						
		}
	};
}


//--------- init on window-load ------
function cjsSetOnloadAction(cJSVar){
	return function(event){
		cJSVar.init();
	};
}

var cjs=new cJS();
window.addEventListener("load",cjsSetOnloadAction(cjs));