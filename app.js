const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const { static } = require("express");



const app = express();

app.use(express.static("public"));
app.set("view engine","ejs");

//home route
app.get("/",(req,res)=>{
    res.render("home");
})

app.listen(3000,()=>{
console.log("Server is Up and Running");
})