//Event handler to check if the user hits submit. If they do, it sends a post request to the route /login 
document.getElementById("submit").addEventListener("click", function(){
    let Rest = {};
	let user = document.getElementById("user").value;
	let pass = document.getElementById("pass").value;
	
	Rest["user"] = user;
	Rest["pass"] = pass;
	console.log("we will send: ", Rest);

    let xhttp = new XMLHttpRequest();
	xhttp.open("POST", `/login`);
	
	xhttp.setRequestHeader("Content-Type", "application/json");
	xhttp.onreadystatechange = function(){
		if(this.readyState == 4 && this.status == 200){
			let text = JSON.parse(xhttp.responseText);
			console.log(text);
			window.location.href = `/users/${text._id}`;

		}
		else if(this.status == 404 && this.readyState == 4){
			alert("Invalid credentials");
		}
	}
	xhttp.send(JSON.stringify(Rest));
	
});