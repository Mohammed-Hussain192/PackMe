const mongoose = require('mongoose')
const usermodel = require('../models/usermodel')
const cookieParser = require('cookie-parser');

const transporter = require('../utils/transport')

async function updatePass( email, password, req, res) {
  
   
    
   let user = await usermodel.findOneAndUpdate(
  { email: email },                 // Filter
  { $set: { password: password} }, // Update
  { new: true }                    // Options: return the updated document
);
    if (user) {

      async function main() {
        // send mail with defined transport object
        const info = await transporter.sendMail({
        from: '"Pack-Me.official" <md.packme.official@gmail.com>',
        to: user.email,
        subject: "Your Password Has Been Successfully Updated",
        html: `
            <p>Dear ${user.name || "User"},</p>

            <p>This is to confirm that the password for your <strong>Pack-Me</strong> account has been successfully updated.</p>

            <p>If you did not perform this change, please contact our support team immediately for assistance.</p>

            <p>Thank you for using <strong>Pack-Me</strong>.</p>

            <p>Warm regards,<br>
            <strong>Pack-Me</strong></p>`
        });

        console.log("Message sent: %s", info.messageId);
        // Message sent: <d786aa62-4e0a-070a-47ed-0b0666549519@ethereal.email>
      }

      main().catch(console.error);

      req.flash("error","Your Password is Updated , PLease login")
      res.redirect("/register/user")
    }
  }




module.exports = updatePass;