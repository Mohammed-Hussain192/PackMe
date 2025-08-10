const mongoose = require('mongoose')
const usermodel = require('../models/usermodel')
const cookieparser = require('cookie-parser')
const transporter = require('../utils/transport')
async function push(name,email,password,phone ,req,res){
  let userfind = await usermodel.findOne({
    email:email
  })
  if(userfind){
      let suc= req.flash("error","Already Have an Account please Login")
        res.redirect("/register/user")
  }else{
      let user = await usermodel.create({
        fullname:name,
        email:email,
        password:password,
        phone:phone,
        isAdmin:"No"
    })
    if(user){
       async function main() {
                    // send mail with defined transport object
                        const info = await transporter.sendMail({
                          from: '"Pack-Me.official" <md.packme.official@gmail.com>', // sender address
                          to: user.email, // list of receivers
                          subject: "Welcome to Pack-Me", // Subject line
                          text: "Hi!"+" "+user.fullname+"\n\n"+"Welcome to Pack-Me Bag! We're thrilled to have you on board. Explore our wide range of stylish and durable bags, perfect for any occasion. Enjoy easy shopping, fast shipping, and excellent customer service. Let us help you find the perfect bag today!"+"\n \n "+"Happy shopping,"+"\n\n"+"The Pack-Me Team"
                        });
                  
                    console.log("Message sent: %s", info.messageId);
                    // Message sent: <d786aa62-4e0a-070a-47ed-0b0666549519@ethereal.email>
                  }
                  
                  main().catch(console.error);
        res.cookie("email",user.email)
        res.redirect("/home")
    }
  }
}

module.exports = push