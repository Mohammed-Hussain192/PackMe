const transporter = require('../utils/transport');
const session = require("express-session");
const flash = require("connect-flash");

async function otpsend(email, otp, req, res) {
  console.log(email, otp);

  try {
    const info = await transporter.sendMail({
      from: '"Pack-Me.official" <md.packme.official@gmail.com>',
      to: email,
      subject: "Your Pack-ME Verification Code",
      html: `
            <p>Dear user,</p>

            <p>Welcome to <strong>Pack-ME</strong>!</p>

            <p>Your One-Time Password (OTP) for verification is:</p>

            <h2 style="color:#2b6cb0;">${otp}</h2>

            <p>This OTP is valid for the next 10 minutes. Please do not share it with anyone.</p>

            <p>If you didn’t request this, please ignore this email.</p>

            <p>Warm regards,<br>
            <strong>Team Pack-Me</strong></p>
        `
    });

    console.log("Message sent: %s", info.messageId);

    req.flash("otp", otp);
     req.flash("email", email);
     req.flash("error","OTP sent to email") // ✅ setting flash message (no need to assign it to a variable)
    res.redirect("/confirm/OTP"); // ✅ redirect to GET route that renders the page
  } catch (error) {
    console.error(error);
    
  }
}

module.exports = otpsend;
