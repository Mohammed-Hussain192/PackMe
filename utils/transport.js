const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    secure:true,
    host: "smtp.gmail.com",
    port: 465,
    auth: {
      user:"md.packme.official@gmail.com",
      pass:"kulhkhgmehltxoxz",
    }
  
})

module.exports = transporter;