//Event handler to check if the user hits submit. If they do, it sends a post request to the route /registration 
document.getElementById("submit").addEventListener("click", function(){
    let Rest = {};
	let user = document.getElementById("user").value;
	let pass = document.getElementById("pass").value;
	
	Rest["user"] = user;
	Rest["pass"] = pass;
	console.log("we will send: ", Rest);

    let xhttp = new XMLHttpRequest();
	xhttp.open("POST", `/registration`);
	
	xhttp.setRequestHeader("Content-Type", "application/json");
	xhttp.onreadystatechange = function(){
		if(this.readyState == 4 && this.status == 200){
			let text = JSON.parse(xhttp.responseText);
			console.log("we received: ", text);
			window.location.href = `/users/${text._id}`;

		}
		else if(this.status == 404 && this.readyState == 4){
			alert("ERROR DUPLICATE NAME ENTERED!");
		}
		else if(this.status == 400 && this.readyState == 4){
			alert("MISSING CREDENTIALS");
		}
	}
	xhttp.send(JSON.stringify(Rest));
	
});



/*
async function userProfile(req, res){
    /*
    
    If the requested profile is set to private and the requesting client is NOT
    logged in as the owner of the profile, then a 404 or 403 status and error
    message should be sent in response
    
    


    //#1. get the object who's id is the same as the id in the parameter
    //#2. Check if its set to private and client isnt logged in, send 403 error 

    //get the object whos id is the same as the id in param:
    let profile = await db.collection("users").find({id: req.params.userID}).toArray();
    if(profile[0].privacy == true && !(req.session.loggedIn == true && req.session.username == profile[0].username && req.session.password == profile[0].password)){
        res.status(403).send("SORRY, the profile is private and your credentials dont match the profile's user/pass");
    }
    else if(profile[0].privacy == false || (req.session.loggedIn == true && req.session.username == profile[0].username && req.session.password == profile[0].password)){

    }

}
*/



