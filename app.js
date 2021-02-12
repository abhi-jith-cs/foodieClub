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
  password:String
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
        res.render("home",{itemsFound:slicedArray});
      }
    
  })
    
})

// signup route
app.get("/signup",(req,res)=>{
res.render("signup")
})



app.post("/signup",function(req,res){
  console.log("evocked")
  User.register({username:req.body.username}, req.body.password, function(err, user) {
if(err){
  console.log(err);
  res.redirect("/signup");
}else{
  console.log("signup else")
  passport.authenticate("local")(req,res,function(){
      console.log("test");
      res.redirect("/");
  })
}

});
})

// signup route


app.get("/signin",(req,res)=>{
  res.render("signin")
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


app.listen(3000,()=>{
console.log("Server is Up and Running");
})