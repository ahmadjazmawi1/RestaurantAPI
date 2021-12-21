//Event handler to check if the user hits submit. If they do, it sends a put request to the route /privacy 
document.getElementById("save").addEventListener("click", function(){
    let Rest = {};
	if(document.getElementById("on").checked)
        Rest["status"] = true;
    else
        Rest["status"] = false;
	
	Rest["name"] = document.getElementById("name").innerHTML.split(" ")[2];

    console.log(Rest);
    let xhttp = new XMLHttpRequest();
	xhttp.open("PUT", `/privacy`);
	
	xhttp.setRequestHeader("Content-Type", "application/json");
	xhttp.onreadystatechange = function(){
		if(this.readyState == 4 && this.status == 200){
			let text = JSON.parse(xhttp.responseText);
			console.log("we received: ", text);
			

		}
		else if(this.status == 404 && this.readyState == 4){
			alert("ERROR DUPLICATE NAME ENTERED!");
		}
	}
	xhttp.send(JSON.stringify(Rest));
	
});