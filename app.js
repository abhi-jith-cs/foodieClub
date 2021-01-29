const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');


mongoose.connect('mongodb://localhost/foodieClub', {useNewUrlParser: true, useUnifiedTopology: true});
const itemSchema = new mongoose.Schema({
    name:String,
    price:Number

});
const Items= new mongoose.model("item",itemSchema);



const app = express();

app.use(express.static("public"));
app.set("view engine","ejs");

//home route
app.get("/",(req,res)=>{
  Items.find(function(err,itemsFound){
      if(!err){
        res.render("home",{itemsFound:itemsFound});
      }
    
  })
    
})

app.listen(3000,()=>{
console.log("Server is Up and Running");
})