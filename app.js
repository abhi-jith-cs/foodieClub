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
   console.log(slicedArray)
    // itemsFound.forEach(item => {
    //   console.log(Math.round(itemsFound.length/3));
    // });
      if(!err){
        res.render("home",{itemsFound:slicedArray});
      }
    
  })
    
})

app.listen(3000,()=>{
console.log("Server is Up and Running");
})