const usermodel = require('../models/usermodel');

async function login(email, password, req, res) {
  try {
    const user = await usermodel.findOne({ email });

    if (!user) {
      req.flash("error", "No account found. Please create an account.");
      return res.redirect("/register/user");
    }

    if (user.password === password) {
      res.cookie("email", user.email);
      return res.redirect("/home");
    } else {
      req.flash("error", "Invalid email or password.");
      return res.redirect("/register/user");
    }
  } catch (err) {
    console.error("Login Error:", err);
    req.flash("error", "Something went wrong. Try again.");
    return res.redirect("/register/user");
  }
}

module.exports = login;
