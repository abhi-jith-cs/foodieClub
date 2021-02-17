const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const session =require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { runInNewContext } = require("vm");





const app = express();



const itemsSchema = new mongoose.Schema({
  name: String,
  price: String,
  img:
  {
      data: Buffer,
      contentType: String
  }
});

const Item = mongoose.model('item', itemsSchema);

const cartSchema = new mongoose.Schema({
  cartItem:[itemsSchema],
  quantity:Number
});





var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now())
  }
})

var upload = multer({ storage: storage })





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
  dob:Date,
  cart:cartSchema
});
userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("user",userSchema);
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());










//home route
app.get("/",(req,res)=>{
 console.log(req.isAuthenticated())
  Item.find(function(err,itemsFound){
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


// admin 
app.get("/admin",(req,res)=>{

  if(req.user){

    if(req.user._id=="602cc33e83c6dc0d902d65c6"){
      res.render("admin",{auth:req.isAuthenticated()});
    }
    else{
      res.send("You don't have access to this page")
    }
  

  }else{
    res.redirect("signin")
  }
 


})


// Step 8 - the POST handler for processing the uploaded file

app.post('/admin', upload.single('image'), (req, res, next) => {

	var obj = {
		name: req.body.name,
		price:req.body.price,
		img: {
			data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
			contentType: 'image/png'
		}
	}
	Item.create(obj, (err, item) => {
		if (err) {
			console.log(err);
		}
		else {
      console.log("image saved to db")
			// item.save();
			res.redirect('/');
		}
	});
});




 // account route
 app.get("/account",(req,res)=>{
   res.render("account",{auth:req.isAuthenticated(),user:req.user});
 })
//cart
app.post("/cart",(req,res)=>{
  if(req.isAuthenticated()){
    const dataToPush = {
      name:req.body.name,
      price:req.body.price
    }
  
    User.findOneAndUpdate(
      { _id: req.user._id}, 
      {cart:{ $push: { cartItem: dataToPush  } }},
     function (error, success) {
           if (error) {
               console.log(error);
           } else {
               console.log("success");
           }
       });
   
  }
  else{
    console.log("user is not authenticated")
    res.render("signin",{auth:req.isAuthenticated()})
  }
})



  


    // User.findById(req.user._id,(err,userData)=>{
    //   userData.cart.cartItem.push(dataToPush);
    //   User.save();
    //   res.render("cart",{auth:req.isAuthenticated(),item:userData.cart.cartItem});

    // })

    // User.findByIdAndUpdate(req.user._id,update,{useFindAndModify: false},(err)=>{
    //   if(err){
    //     console.log("error adding cart to user")
    // }
    // })



    // User.findById(req.user._id,(err,userData)=>{
    //   console.log(userData.cart.cartItem)
    // })





 
  // const cart1=new cart({
  //   item:{
  //     name:req.body.name,
  //     price:req.body.price    },
  //   quantity:1
  // });
  // cart1.save((err)=>{
  //   if(!err){
  //     console.log("success with cart");
  //   }else{
  //     console.log("err cart")
  //   }
  // })

app.listen(3000,()=>{
console.log("Server is Up and Running");
})