const bcrypt = require("bcryptjs"); //載入 bcrypt
const db = require("../models");
const { User } = db;
const { localFileHandler } = require("../helpers/file-helpers");
const userController = {
  signUpPage: (req, res) => {
    res.render("signup");
  },
  signUp: (req, res, next) => {
    //修改這裡
    // 如果兩次輸入的密碼不同，就建立一個 Error 物件並拋出
    if (req.body.password !== req.body.passwordCheck)
      throw new Error("Passwords do not match!");

    // 確認資料裡面沒有一樣的 email，若有，就建立一個 Error 物件並拋出
    User.findOne({ where: { email: req.body.email } })
      .then((user) => {
        if (user) throw new Error("Email already exists!");
        return bcrypt.hash(req.body.password, 10); // 前面加 return
      })
      .then((hash) =>
        User.create({
          //上面錯誤狀況都沒發生，就把使用者的資料寫入資料庫
          name: req.body.name,
          email: req.body.email,
          password: hash,
        })
      )
      .then(() => {
        req.flash("success_messages", "Successfully registered！"); //並顯示成功訊息
        res.redirect("/signin");
      })
      .catch((err) => next(err)); //接住前面拋出的錯誤，呼叫專門做錯誤處理的 middleware
  },
  signInPage: (req, res) => {
    res.render("signin");
  },
  signIn: (req, res) => {
    req.flash("success_messages", "Successfully logged in！");
    res.redirect("/restaurants");
  },
  logout: (req, res) => {
    req.flash("success_messages", "Successfully logged out！");
    req.logout();
    res.redirect("/signin");
  },
  getUser: (req, res, next) => {
   const id = req.params.id;
    User.findByPk(id)
      .then((user) => {
        if (!user) throw new Error("User didn't exist.");
        const userData = {
          name: user.get("name"),
          email: user.get("email"),
          image: user.get("image"),
          isAdmin: user.get("isAdmin"),
          id: user.get('id'),
        };
        console.log(user)
        res.render("profile", { user: userData });
      })
      .catch((err) => next(err));
  },
  editUser: (req, res, next) => {
    const id = req.params.id;
    // const id = req.user.id;
    User.findByPk(id)
      .then((user) => {
        if (!user) throw new Error("User didn't exist.");
        const userData = {
          name: user.get("name"),
          email: user.get("email"),
          image: user.get("image"),
          isAdmin: user.get("isAdmin"),
          id: user.get('id'),
        };
        res.render("edit-profile", { user: userData });
      })
      .catch((err) => next(err));
  },
  putUser: (req, res, next) => {
    const { name } = req.body
    if (!name) throw new Error('User name is required!')
    const { file } = req // 把檔案取出來
    Promise.all([ // 非同步處理
      User.findByPk(req.user.id), // 去資料庫查有沒有這個使用者
      localFileHandler(file) // 把檔案傳到 file-helper 處理
    ])
      .then(([user, filePath]) => { // 以上兩樣事都做完以後
        if (!user) throw new Error("User didn't exist!")
        return user.update({ // 修改這筆資料
          name,
          image: filePath || user.image // 如果 filePath 是 Truthy (使用者有上傳新照片) 就用 filePath，是 Falsy (使用者沒有上傳新照片) 就沿用原本資料庫內的值
        })
      })  
      .then(() => {
        req.flash("success_messages", "Profile successfully updated.")
        res.redirect("profile");
      })
      .catch((err) => next(err))
  }
}
module.exports = userController;
