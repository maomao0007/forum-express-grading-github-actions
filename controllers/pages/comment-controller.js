const commentServices = require('../../services/comment-services')
const commentController = {
  postComment: (req, res, next) => {
    commentServices.postComment(req, (err, data) => {
      if (err) {
        return next(err)
      }
      const restaurantId = data.comment.restaurantId // 確保 `data.comment` 包含 `restaurantId`
      res.redirect(`/restaurants/${restaurantId}`)
    })
  },

  deleteComment: (req, res, next) => {
    commentServices.deleteComment(req, (err, data) => {
      if (err) {
        return next(err)
      }
      const restaurantId = data.deletedComment.restaurantId // 確保 `data.deletedComment` 包含 `restaurantId`
      res.redirect(`/restaurants/${restaurantId}`)
    })
  }
}

module.exports = commentController
