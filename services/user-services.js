const bcrypt = require('bcryptjs') // 載入 bcrypt
const { User, Comment, Restaurant, Favorite, Like, Followship } = require('../models')
const { imgurFileHandler } = require('../helpers/file-helpers')
const userServices = {
  logout: (req, cb) => {
    try {
      req.logout()
      cb(null, '/signin')
    } catch (err) {
      cb(err)
    }
  },
  getUser: (req, cb) => {
    return User.findByPk(req.params.id, {
      include: [
        { model: Comment, include: [Restaurant] },
        { model: Restaurant, as: 'FavoritedRestaurants' },
        { model: User, as: 'Followers' },
        { model: User, as: 'Followings' }
      ]
    })
      .then(user => {
        if (!user) throw new Error("User didn't exist.")

        // 轉換為 JSON 格式
        user = user.toJSON()
        // 檢查 user.Comments 是否存在，並剔除了重複評論的餐廳
        const uniqueCommented =
          user.Comments && user.Comments.length > 0
            ? [
                ...new Set(
                  user.Comments
                    // 確保 c 和 c.Restaurant 存在
                    .filter(c => c && c.Restaurant)
                    .map(c => c.Restaurant.id)
                )
              ]
                // 確保 c 和 c.Restaurant 存在
                .map(id =>
                  user.Comments.find(
                    c => c && c.Restaurant && c.Restaurant.id === id
                  )
                )
            : []

        return cb(null, {
          user,
          uniqueCommented
        })
      })
      .catch(err => cb(err))
  },
  putUser: (req, cb) => {
    const { name } = req.body
    if (req.user.id !== Number(req.params.id)) { throw new Error('只能更改自己的資料！') }
    if (!name) throw new Error('User name is required!')
    // 把檔案取出來
    const { file } = req
    // 非同步處理
    return Promise.all([
      // 去資料庫查有沒有這個使用者
      User.findByPk(req.params.id),
      // 把檔案傳到 file-helper 處理
      imgurFileHandler(file)
    ])
      .then(([user, filePath]) => {
        // 以上兩樣事都做完以後
        if (!user) throw new Error("User didn't exist!")
        return user.update({
          name,
          // 如果 filePath 是 Truthy (使用者有上傳新照片) 就用 filePath，是 Falsy (使用者沒有上傳新照片) 就沿用原本資料庫內的值
          image: filePath || user.image
        })
      })
      .then(user => {
        return cb(null, `/users/${user.id}`)
      })
      .catch(err => cb(err))
  },
  getTopUsers: (req, cb) => {
    // 撈出所有 User 與 followers 資料
    return User.findAll({
      include: [{ model: User, as: 'Followers' }]
    })
      .then(users => {
        // 整理 users 資料，把每個 user 項目都拿出來處理一次，並把新陣列儲存在 users 裡
        const result = users
          .map(user => ({
            // 整理格式
            ...user.toJSON(),
            // 計算追蹤者人數
            followerCount: user.Followers.length,
            // 判斷目前登入的使用者是否已追蹤該 user 物件
            isFollowed: req.user.Followings.some(f => f.id === user.id)
          }))
          // 根據 followerCount 把 user 由大排到小，追蹤者多的人排在前面
          .sort((a, b) => b.followerCount - a.followerCount)
        return cb(null, { users: result })
      })
      .catch(err => {
        console.error('Error in getUser:', err)
        cb(err)
      })
  },
  addFavorite: (req, cb) => {
    const { restaurantId } = req.params
    return Promise.all([
      Restaurant.findByPk(restaurantId),
      Favorite.findOne({
        // 找 user 和 restaurant 之間的關係，如果有關係，表示之前已加入收藏
        where: {
          userId: req.user.id,
          restaurantId
        }
      })
    ])
      .then(([restaurant, favorite]) => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")
        if (favorite) throw new Error('You have favorited this restaurant!')

        return Favorite.create({
          userId: req.user.id,
          restaurantId
        })
      })
      .then(() => {
        return cb(null, 'redirect(back)')
      })
      .catch(err => cb(err))
  },
  editUser: (req, cb) => {
    const id = req.params.id
    return User.findByPk(id)
      .then(user => {
        if (!user) throw new Error("User didn't exist.")
        user = user.toJSON()

        return cb(null, {
          user
        })
      })
      .catch(err => cb(err))
  },
  removeFavorite: (req, cb) => {
    return Favorite.findOne({
      where: {
        userId: req.user.id,
        restaurantId: req.params.restaurantId
      }
    })
      .then(favorite => {
        // userId 與 restaurantId 如果沒有關聯，就回傳錯誤訊息
        if (!favorite) throw new Error("You haven't favorited this restaurant")

        return favorite.destroy() // 有關聯就刪除
      })
      .then(() => {
        return cb(null, 'redirect(back)')
      })
      .catch(err => cb(err))
  },
  addLike: (req, cb) => {
    const { restaurantId } = req.params
    return Promise.all([
      Restaurant.findByPk(restaurantId),
      Like.findOne({
        where: {
          userId: req.user.id,
          restaurantId
        }
      })
    ])
      .then(([restaurant, like]) => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")
        if (like) throw new Error('You have liked this restaurant!')

        return Like.create({
          userId: req.user.id,
          restaurantId
        })
      })
      .then(() => {
        return cb(null, 'redirect(back)')
      })
      .catch(err => cb(err))
  },
  removeLike: (req, cb) => {
    return Like.findOne({
      where: {
        userId: req.user.id,
        restaurantId: req.params.restaurantId
      }
    })
      .then(like => {
        if (!like) throw new Error("You haven't liked this restaurant")

        return like.destroy()
      })
      .then(() => {
        return cb(null, 'redirect(back)')
      })
      .catch(err => cb(err))
  },
  addFollowing: (req, cb) => {
    const { userId } = req.params
    Promise.all([
      User.findByPk(userId),
      Followship.findOne({
        where: {
          followerId: req.user.id,
          followingId: req.params.userId
        }
      })
    ])
      .then(([user, followship]) => {
        if (!user) throw new Error("User didn't exist!")
        if (followship) throw new Error('You are already following this user!')
        return Followship.create({
          followerId: req.user.id,
          followingId: userId
        })
      })
      .then(() => {
        return cb(null, 'redirect(back)')
      })
      .catch(err => cb(err))
  },
  removeFollowing: (req, cb) => {
    Followship.findOne({
      where: {
        followerId: req.user.id,
        followingId: req.params.userId
      }
    })
      .then(followship => {
        if (!followship) throw new Error("You haven't followed this user!")
        return followship.destroy()
      })
      .then(() => {
        return cb(null, 'redirect(back)')
      })
      .catch(err => cb(err))
  }
}

module.exports = userServices
