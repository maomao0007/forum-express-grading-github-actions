const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const { User } = require('../../models')
const userServices = require('../../services/user-services')

const userController = {
  signUp: (req, res, next) => {
    // 如果兩次輸入的密碼不同，返回錯誤響應
    if (req.body.password !== req.body.passwordCheck) {
      return res.json({
        status: 'error',
        message: 'Passwords do not match.'
      })
    }

    // 確認資料裡面沒有一樣的 email
    User.findOne({ where: { email: req.body.email } })
      .then(user => {
        if (user) {
          return res.json({
            status: 'error',
            message: 'Email already exists'
          })
        }
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
      .then(newUser => {
        const userData = newUser.toJSON()
        delete userData.password
        res.json({
          status: 'success',
          message: 'User registered successfully',
          data: {
            user: userData
          }
        })
      })
      // 接住前面拋出的錯誤，呼叫專門做錯誤處理的 middleware
      .catch(err => {
        next(err)
      })
  },
  signIn: (req, res, next) => {
    try {
      const userData = req.user.toJSON()
      delete userData.password
      const token = jwt.sign(userData, process.env.JWT_SECRET, {
        expiresIn: '30d'
      }) // 簽發 JWT，效期為 30 天
      res.json({
        status: 'success',
        data: {
          token,
          user: userData
        }
      })
    } catch (err) {
      next(err)
    }
  },
  logout: (req, res, next) => {
    userServices.logout(req, (err, data) => (err ? next(err) : res.json(data)))
  },
  getUser: (req, res, next) => {
    userServices.getUser(req, (err, data) =>
      err ? next(err) : res.json({ status: 'success', data })
    )
  },
  putUser: (req, res, next) => {
    userServices.putUser(req, (err, data) =>
      err ? next(err) : res.json({ status: 'success', data })
    )
  },
  editUser: (req, res, next) => {
    userServices.editUser(req, (err, data) =>
      err ? next(err) : res.json({ status: 'success', data })
    )
  },
  getTopUsers: (req, res, next) => {
    userServices.getTopUsers(req, (err, data) =>
      err ? next(err) : res.json({ status: 'success', data })
    )
  },
  addFavorite: (req, res, next) => {
    userServices.addFavorite(req, (err, data) =>
      err ? next(err) : res.json({ status: 'success', data })
    )
  },
  removeFavorite: (req, res, next) => {
    userServices.removeFavorite(req, (err, data) =>
      err ? next(err) : res.json({ status: 'success', data })
    )
  },
  addLike: (req, res, next) => {
    userServices.addLike(req, (err, data) =>
      err ? next(err) : res.json({ status: 'success', data })
    )
  },
  removeLike: (req, res, next) => {
    userServices.removeLike(req, (err, data) =>
      err ? next(err) : res.json({ status: 'success', data })
    )
  },
  addFollowing: (req, res, next) => {
    userServices.addFollowing(req, (err, data) =>
      err ? next(err) : res.json({ status: 'success', data })
    )
  },
  removeFollowing: (req, res, next) => {
    userServices.removeFollowing(req, (err, data) =>
      err ? next(err) : res.json({ status: 'success', data })
    )
  }
}
module.exports = userController
