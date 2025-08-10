const mongoose = require('mongoose')


const userSchema =mongoose.Schema( {
    fullname:{
        type:String,
        minLenght:3,
        
    },
    email:{
        type:String,
        
    },
  
    password:String,
    phone:{
        type:String,
        
    },
    isAdmin: {
        type: String,
        default: "No"
    }
    

   

});

module.exports=mongoose.model("Account",userSchema)