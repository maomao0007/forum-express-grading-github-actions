const bcrypt = require("bcryptjs"); //載入 bcrypt
const db = require("../models");
const { User, Comment, Restaurant } = db;
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
      //接住前面拋出的錯誤，呼叫專門做錯誤處理的 middleware
      .catch((err) => next(err)); 
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
    return User.findByPk(req.params.id, {
      include: { model: Comment, include: [Restaurant] },
    })
      .then((user) => {
        if (!user) throw new Error("User didn't exist.");

        // 轉換為 JSON 格式
        user = user.toJSON();

        res.render("users/profile", {
          user,
          // 預防 Comments 為 null 或 undefined
          comments: user.Comments || [],
        });
      })
      .catch((err) => next(err));
  },

  editUser: (req, res, next) => {
    const id = req.params.id;
    return User.findByPk(id)
      .then((user) => {
        if (!user) throw new Error("User didn't exist.");
        user = user.toJSON();

        res.render("users/edit", {
          user,
          comments: user.Comments,
        });
      })
      .catch((err) => next(err));
  },
  putUser: (req, res, next) => {
    const { name } = req.body;
    if (req.user.id !== Number(req.params.id))
      throw new Error("只能更改自己的資料！");
    if (!name) throw new Error("User name is required!");
    // 把檔案取出來
    const { file } = req;
    // 非同步處理
    return Promise.all([
      // 去資料庫查有沒有這個使用者
      User.findByPk(req.params.id),
      // 把檔案傳到 file-helper 處理
      localFileHandler(file),
    ])
      .then(([user, filePath]) => {
        // 以上兩樣事都做完以後
        if (!user) throw new Error("User didn't exist!");
        return user.update({
          name,
          // 如果 filePath 是 Truthy (使用者有上傳新照片) 就用 filePath，是 Falsy (使用者沒有上傳新照片) 就沿用原本資料庫內的值
          image: filePath || user.image,
        });
      })
      .then((user) => {
        req.flash("success_messages", "使用者資料編輯成功");
        res.redirect(`/users/${user.id}`);
      })
      .catch((err) => next(err));
  },
};
module.exports = userController;
