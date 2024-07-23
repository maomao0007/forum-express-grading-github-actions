const adminServices = require('../../services/admin-services')
const { imgurFileHandler } = require('../../helpers/file-helpers') // 將 file-helper

const adminController = {
  getRestaurants: (req, res, next) => {
    adminServices.getRestaurants(req, (err, data) =>
      err ? next(err) : res.render('admin/restaurants', data)
    )
  },
  createRestaurant: (req, res) => {
    adminServices.createRestaurant(req, (err, data) =>
      err ? next(err) : res.render('admin/create-restaurant', data)
    )
  },
  editRestaurant: (req, res, next) => {
    adminServices.editRestaurant(req, (err, data) =>
      err ? next(err) : res.render('admin/edit-restaurant', data)
    )
  },
  postRestaurant: (req, res, next) => {
    adminServices.postRestaurant(req, (err, data) =>
      err ? next(err) : res.render('admin/restaurants', data)
    )
  },
  getRestaurant: (req, res, next) => {
    adminServices.getRestaurant(req, (err, data) =>
      err ? next(err) : res.render('admin/restaurant', data)
    )
  },

  putRestaurant: (req, res, next) => {
    adminServices.putRestaurant(req, (err, data) =>
      err ? next(err) : res.redirect('/admin/restaurants', data)
    )
  },
  deleteRestaurant: (req, res, next) => {
    adminServices.deleteRestaurant(req, (err, data) => {
      if (err) return next(err)
      req.session.deletedData = data
      return res.redirect('/admin/restaurants')
    })
  },
  getUsers: (req, res, next) => {
    adminServices.getUsers(req, (err, data) =>
      err ? next(err) : res.render('admin/users', data)
    )
  },
  patchUser: (req, res, next) => {
    adminServices.patchUser(req, (err, data) =>
      err ? next(err) : res.render('admin/users', data)
    )
  }
}

module.exports = adminController
