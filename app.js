const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const session =require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");



const app = express();


app.set("view engine","ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));


app.use(session({
  secret: 'This is secret key',
  resave: false,
  saveUninitialized: true
}))

app.use(passport.initialize());
app.use(passport.session());



mongoose.connect('mongodb://localhost/foodieClub', {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set('useCreateIndex', true);

const userSchema = new mongoose.Schema({
  email:String,
  password:String,
  firstName:String,
  lastName:String,
  dob:Date
});
userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("user",userSchema);
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


const itemSchema = new mongoose.Schema({
    name:String,
    price:Number

});
const Items= new mongoose.model("item",itemSchema);







//home route
app.get("/",(req,res)=>{
 console.log(req.isAuthenticated())
  Items.find(function(err,itemsFound){
    const slicedArray=[]
    let start =0;
    for(let i=3;start<itemsFound.length;i=i+3){
      if(itemsFound.length>=i){
      slicedArray.push(itemsFound.slice(start,i));
      start=start+3;
      }else{
        slicedArray.push(itemsFound.slice(start,itemsFound.length));
        start=start+3;
      }
    }
      if(!err){
        res.render("home",{itemsFound:slicedArray,auth:req.isAuthenticated()});
      }
    
  })
    
})

// signup route
app.get("/signup",(req,res)=>{
res.render("signup",{auth:req.isAuthenticated()})
})



app.post("/signup",function(req,res){

  User.register({username:req.body.username}, req.body.password, function(err, user) {
if(err){
  console.log(err);
  res.redirect("/signup");
}else{
  console.log("signup else")

User.findOneAndUpdate({username:req.body.username},{firstName:req.body.firstName,
  lastName:req.body.lastName,
  dob:req.body.dob},(err)=>{
if(!err){
console.log("successfully added user")
}
})
  passport.authenticate("local")(req,res,function(){
      console.log("test");
      res.redirect("/");
  })
}

});
})

// signup route


app.get("/signin",(req,res)=>{
  res.render("signin",{auth:req.isAuthenticated()})
  })


app.post("/signin",function(req,res){
    const user = new User({
        username:req.body.username,
        password:req.body.password
    });
 
    req.login(user,function(err){
        if(err){
            console.log(err)
        }else{
         passport.authenticate("local")(req,res,function(){
             console.log("logedin");
             res.redirect("/");

             
         })
        }
    })
 
 });

 // account route
 app.get("/account",(req,res)=>{
   res.render("account",{auth:req.isAuthenticated(),user:req.user});
 })


app.listen(3000,()=>{
console.log("Server is Up and Running");
})