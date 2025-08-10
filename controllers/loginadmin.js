const mongoose = require('mongoose')
const usermodel = require('../models/usermodel')
async function login(email,password,req,res){
   let findone = await usermodel.findOne({email:email})
   if(!findone){
        let suc= req.flash("error","No Account Found , Please Creae a Account")
        res.redirect("/register/user")
   }
   if(findone.password == password){

    if(findone.isAdmin == "Yes"){
        res.cookie("Admin",findone.email)
        res.redirect("/admin/home")
    }
    else
    {
        let suc= req.flash("error","You are not authorized , as Admin")
        res.redirect("/register/user")
    }
  
   }else{
    let suc= req.flash("error","invalid Email or Password")
    res.redirect("/register/user")
   }
}

module.exports = login