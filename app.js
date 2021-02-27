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




const app = express();



const itemsSchema = new mongoose.Schema({
  name: String,
  price: String,
  img:
  {
      data: Buffer,
      contentType: String
  },
  quantity:Number

});

const Item = mongoose.model('item', itemsSchema);

const cartSchema = new mongoose.Schema({
  cartItem:[itemsSchema],
  total:Number
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
  dob:req.body.dob,
  cart:cartSchema,
},(err)=>{
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

    if(req.user._id=="60349145cfa13136c8e92ee7"){
      res.render("admin",{auth:req.isAuthenticated()});
    }
    else{
      res.send("You don't have access to this page")
    }
  

  }else{
    res.redirect("signin")
  }
 


})



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
app.get("/cart",(req,res)=>{
  if(req.isAuthenticated()){
    User.findById(req.user._id,(err,user)=>{
      if(!err){
       res.render("cart",{auth:req.isAuthenticated(),item:user.cart.cartItem,total:user.cart.total
       })
      }else{
        console.log(err)
      }
    })
  }else{
    res.redirect("/signin")
  }
 
})



app.post("/cart",(req,res)=>{
  let flag;
  let index;
  let price = req.body.price
  if(req.isAuthenticated()){
    const dataToPush = {
      name:req.body.name,
      price:req.body.price,
      quantity:1
    }
    User.findById(req.user._id,(err,data)=>{
      (data.cart.cartItem).forEach((element,i)=> {
      if (element.name===req.body.name){
      flag=true;
      index=i;
      return;
      }
      });   
      console.log(flag)
      if(!flag){
        //Item dont exist so add to cart 
    data.cart.cartItem.push(dataToPush);
    if (!data.cart.total){
      data.cart.total=0;
    }
    data.cart.total=parseInt(data.cart.total)+parseInt(req.body.price);
  }else{
    // Item already exist so increment quantity
    console.log("Item already added to cart")
    data.cart.total=parseInt(data.cart.total)+parseInt(req.body.price);
console.log((data.cart.cartItem[index].quantity)++)
    data.cart.cartItem[index].quantity=(data.cart.cartItem[index].quantity)++;
    console.log(data.cart);

  }
  data.save((err)=>{
    if(!err){
      console.log("success");
    }else{
      console.log("fail")
      console.log(err)
    }
  })

   }).then(()=>
   User.findById(req.user._id,(err,user)=>{
     if(!err){
      res.render("cart",{auth:req.isAuthenticated(),item:user.cart.cartItem,total:user.cart.total
      })
     }else{
       console.log(err)
     }
   })
   )
  

   
  }
  else{
    console.log("user is not authenticated")
    res.render("signin",{auth:req.isAuthenticated()})
  }
})

//delete
app.post('/delete/:id', function(req, res){
  User.findById(req.user._id,(err,data)=>{
    if(!err){
     const index= (data.cart.cartItem).findIndex((element)=>{
        return element._id==req.params.id
      })

      data.cart.total -= data.cart.cartItem[index].price;

  if(data.cart.cartItem[index].quantity<=1){
    //deleting enitre item from cart items
    console.log("deleting entire item")
    if (index > -1) {
      (data.cart.cartItem).splice(index, 1);
      data.save((err)=>{
        if(!err){
          console.log("success");
        }else{
          console.log("fail")
          console.log(err)
        }
      })
    }
  }else{
    //quantity decrement
    console.log("updating quantity item")

    data.cart.cartItem[index].quantity--;
    data.save((err)=>{
      if(!err){
        console.log("success");
      }else{
        console.log("fail")
        console.log(err)
      }
    })
  }


}
  }).then(()=>
  User.findById(req.user._id,(err,user)=>{
    if(!err){
     res.render("cart",{auth:req.isAuthenticated(),item:user.cart.cartItem,total:user.cart.total
     })
    }else{
      console.log(err)
    }
  })
  )
});


// logout
app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});


app.listen(3000,()=>{
console.log("Server is Up and Running");
})