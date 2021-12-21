const pug = require("pug");
const express = require("express");

const mongo = require('mongodb');

const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://database:<database>@cluster0.jidfp.mongodb.net/a4?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const collection = client.db("cluster0").collection("users");
  // perform actions on the collection object
  client.close();
});

let db;

const session = require("express-session");

const mongoStore = require('connect-mongodb-session')(session);
const app = express();
app.set("view engine", "pug");
app.use(express.json());

//Set up the routes
app.use(express.static("public"));
let myStore = new mongoStore({
    uri:'mongodb://localhost:27017/a4', 
    collection: 'sessionData'
})
app.use(session({ secret: 'some secret key here', store: myStore, resave: true,  saveUninitialized: false}));

app.get("/", Welcome); 

app.get("/users", queryName);
app.get("/users/:userID", userProfile);

app.get("/order", (req, res) => {if(req.session.loggedIn) res.render("orderform", {user: req.session}); else res.status(404).send("YOU MUST LOGIN!!!")});
app.get("/orders/:orderID", showOrder)
app.post("/orders", saveOrder)
app.get("/login", (req, res) => {res.render("login", {user:req.session})});
app.post("/login", validateLogin);
app.put("/privacy", changePrivacy);

app.get("/logout", processLogout);

app.get("/register", (req, res) => {res.render("register"); console.log(req.session)});
app.get("/profile", (req, res) => {res.render("profile")});
app.post("/registration", checkRegister)

/**
 * @function Welcome
 * @Purpose renders the home page and if the user is logged in, sets their id 
 * @param {*} req 
 * @param {*} res 
 */
function Welcome(req, res) {
    if(req.session.loggedIn){
        req.session._id = genID(req, res);
        res.render("Welcome", {user:req.session});
    }
    else{
        req.session.loggedIn = false;
        res.render("Welcome", {user:req.session});
    }
    
};

/**
 * Function: queryName
 * Purpose:  queries the users collection for the documents whos username contains the name parameter (if specified). 
 * If not specified, shows all the users in users collection
 * 
 * @param {*} req the request being sent
 * @param {*} res the response to the request
 */
 function queryName(req, res) {
   
    if(req.query.name){
        db.collection("users")
        .find({privacy: false, username: { '$regex' : req.query.name, '$options' : 'i' }})
        .toArray((err, result)=>{
            res.render("users", {user:req.session, users: result});
        });
        
    }
    else{
        
        db.collection("users")
        .find({privacy: false})
        .toArray((err, result)=>{
            res.render("users", {user:req.session, users: result});        
        });
    
    }
}

/**
 * @Function genID
 * @purpose to set the sessions id to the id of the user in the users collection
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
function genID(req, res) {
    db.collection("users").find({username:req.session.username}).toArray((err, result) => {
        req.session._id = result._id;
        return req.session;
    });
    return req.session._id;
}
/**
 * @function checkRegister
 * @Purpose checks the username and password that user enters dont match the usernames in the users collection.
 * inserts the new user into the user collection
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function checkRegister(req, res){
    if(!req.body.pass|| !req.body.user || (!req.body.pass && !req.body.user)){
        res.status(400).send("MISSING!!!!!!!");
        return;
    } 
    
    let found =await db.collection("users").find().toArray();
    for(let elem of found){
        if(elem.username == req.body.user){
            res.status(404).send("ERROR: DUPLICATE USERNAME");
            return;
        }
    }
    req.session.loggedIn = true;
    req.session.privacy=false;
    
    req.session.username = req.body.user;
    req.session.password = req.body.pass;
    let users = {};
    users.username = req.body.user;
    users.password = req.body.pass;
    users.privacy=false;
   
    db.collection("users").insertOne(users, function(err, res) {
        if (err) throw err;
        console.log("1 document inserted");
    });
    res.status(200).send(users);       
    
}
/**
 * @Function showOrder
 * @purpose renders the order summary page if user who made order is public or the client is logged in as the user who made order
 * @param {*} req 
 * @param {*} res 
 */
function showOrder(req, res) {
    var ObjectId = require('mongodb').ObjectId;
    id = new ObjectId(req.params.orderID.toString());
    db.collection("order").findOne({_id:id},function(err, order) {
        
        //if the order id does not exist
        if(!order){
            res.status(404).send("The user did not make an order");
            return;
        }
        
        db.collection("users").findOne({username:order.name},function(err, user) {
            if(user.username!=req.session.username && user.privacy == true)
                res.status(403).send("The person who made the order is private and you are not logged in as them!!");
            else
                res.render("orderSummary", {order:order, user:req.session, user2:user})
        })
    });

}
/**
 * @Function changePrivacy
 * @purpose updates the privacy property of the user in the users collection
 * @param {*} req 
 * @param {*} res 
 */
function changePrivacy(req,res) {
    
    db.collection("users").updateOne({username: req.body.name},{$set: {privacy: req.body.status}}, function(err, data) {
        if (err) throw err;
        console.log("1 document updated");
        
    });
    req.session.privacy = req.body.status;
}
/**
 * @function saveOrder
 * @purpose adds a new order document to the order collection in the database
 * @param {*} req 
 * @param {*} res 
 */
function saveOrder(req, res) {

    db.collection("order").insertOne(req.body, function(err, res) {
        if (err) throw err;
        console.log("1 document inserted"); 
    });
    res.status(200).send(req.body);   

}
/**
 * @function validateLogin
 * @purpose checks if the login credentials are valid (dont match usernames in the users collection)
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function validateLogin(req, res){
    let obj = {};
    let found = await db.collection("users").find().toArray();
    for(let i of found){
        if(i.username == req.body.user){
            obj["_id"] = i._id;
            req.session.username = req.body.user;
            req.session.password = req.body.pass;
            req.session.loggedIn = true;
            req.session._id = i._id;
            res.status(200).send(obj);
            return;
        }
    }

    res.status(404).send("username does not exist");
}
/**
 * @function userProfile
 * @purpose renders the user profile if the profile is not private or the client is logged in as the user 
 * @param {*} req 
 * @param {*} res 
 */
async function userProfile(req, res){
    req.session._id = req.params.userID;

    let profile = [];
    
    var ObjectId = require('mongodb').ObjectId;
    id = new ObjectId(req.params.userID.toString()); // wrap in ObjectID
    profile = await db.collection("users").find({_id: id}).toArray();
    
    
    let change=false;

   
    
    db.collection("users").find({_id:id}).toArray((err, results)=>{
        if(!results){
            res.status(404).send("username does not exist");
            return;
        }
        
        //If the requested profile is set to private and the requesting client is NOT logged in as the owner of the profile
        if(results[0].privacy == true && !(req.session.loggedIn == true && req.session.username == results[0].username && req.session.password == results[0].password)){
            
            res.status(403).send("SORRY, the profile is private and your credentials dont match the profile's user/pass");
            return;
        }
        else if(results[0].username == req.session.username && req.session.loggedIn == true){
            change = true;
        }
        
        //if profile is not private or requesting client is logged in as the user
        else if(results[0].privacy == false || (req.session.loggedIn == true && req.session.username == results[0].username && req.session.password == results[0].password)){
            
            change = false;
        }
        //query the database for the orders whos name matches the results[0] username.
        db.collection("order").find({name: results[0].username}).toArray(function(err, results){

            res.status(200).render("profile", {user: profile[0], privacy: change, session: req.session, orders: results});
        })
       

        
    });

}
/**
 * @function processLogout
 * @purpose Logs out the user
 * @param {*} req 
 * @param {*} res 
 */
function processLogout(req, res) {
    req.session.username = "";
    req.session.password = "";
    req.session.loggedIn = false;
    res.redirect("/");
}

MongoClient.connect("mongodb://localhost/store", function(err, client) {
  if(err) throw err;

  //Get the t8 database
  db = client.db('a4');

  // Start server once Mongo is initialized
  app.listen(process.env.PORT || 3000);
  console.log("Listening on port 3000");
});
