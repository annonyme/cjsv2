define(
		function(){
			
			return {
				value:0,
				name:"module-controller",
				
				add:function(event){
					this.value++;
					console.log("Example add +1: "+this.value);
				}
			};
			
		}
);