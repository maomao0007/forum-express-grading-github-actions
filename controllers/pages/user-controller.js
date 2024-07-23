const bcrypt = require('bcryptjs') // 載入 bcrypt
const db = require('../../models')
const { User, Comment, Restaurant, Favorite, Like, Followship } = db
const userServices = require('../../services/user-services')
const { imgurFileHandler } = require('../../helpers/file-helpers')

const userController = {
  signUpPage: (req, res) => {
    res.render('signup')
  },
  signUp: (req, res, next) => {
    // 修改這裡
    // 如果兩次輸入的密碼不同，就建立一個 Error 物件並拋出
    if (req.body.password !== req.body.passwordCheck) { throw new Error('Passwords do not match!') }

    // 確認資料裡面沒有一樣的 email，若有，就建立一個 Error 物件並拋出
    User.findOne({ where: { email: req.body.email } })
      .then(user => {
        if (user) throw new Error('Email already exists!')
        return bcrypt.hash(req.body.password, 10) // 前面加 return
      })
      .then(hash =>
        User.create({
          // 上面錯誤狀況都沒發生，就把使用者的資料寫入資料庫
          name: req.body.name,
          email: req.body.email,
          password: hash
        })
      )
      .then(() => {
        req.flash('success_messages', 'Successfully registered！') // 並顯示成功訊息
        res.redirect('/signin')
      })
      // 接住前面拋出的錯誤，呼叫專門做錯誤處理的 middleware
      .catch(err => next(err))
  },
  signInPage: (req, res) => {
    res.render('signin')
  },
  signIn: (req, res) => {
    req.flash('success_messages', 'Successfully logged in！')
    res.redirect('/restaurants')
  },
  logout: (req, res) => {
    userServices.logout(req, (err, data) =>
      err ? next(err) : res.redirect('/signin', data)
    )
  },
  getUser: (req, res, next) => {
    userServices.getUser(req, (err, data) =>
      err ? next(err) : res.render('users/profile', data)
    )
  },
  editUser: (req, res, next) => {
    userServices.editUser(req, (err, data) =>
      err ? next(err) : res.render('users/edit', data)
    )
  },
  putUser: (req, res, next) => {
    userServices.putUser(req, (err, data) =>
      err ? next(err) : res.redirect(`/users/${user.id}`, data)
    )
  },
  getTopUsers: (req, res, next) => {
    userServices.getTopUsers(req, (err, data) =>
      err ? next(err) : res.render('top-users', data)
    )
  },
  addFavorite: (req, res, next) => {
    userServices.addFavorite(req, (err, data) =>
      err ? next(err) : res.redirect('back', data)
    )
  },
  removeFavorite: (req, res, next) => {
    userServices.removeFavorite(req, (err, data) =>
      err ? next(err) : res.redirect('back', data)
    )
  },
  addLike: (req, res, next) => {
    userServices.addLike(req, (err, data) =>
      err ? next(err) : res.redirect('back', data)
    )
  },
  removeLike: (req, res, next) => {
    userServices.removeLike(req, (err, data) =>
      err ? next(err) : res.redirect('back', data)
    )
  },
  addFollowing: (req, res, next) => {
    userServices.addFollowing(req, (err, data) =>
      err ? next(err) : res.redirect('back', data)
    )
  },
  removeFollowing: (req, res, next) => {
    userServices.removeFollowing(req, (err, data) =>
      err ? next(err) : res.redirect('back', data)
    )
  }
}
module.exports = userController
