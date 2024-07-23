const { Restaurant, Category, User, Comment } = require('../models')
const { getOffset, getPagination } = require('../helpers/pagination-helper')
const restaurantServices = {
  getRestaurants: (req, cb) => {
    const DEFAULT_LIMIT = 9
    const categoryId = Number(req.query.categoryId) || ''
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || DEFAULT_LIMIT
    const offset = getOffset(limit, page)
    Promise.all([
      Restaurant.findAndCountAll({
        include: Category,
        where: {
          ...(categoryId ? { categoryId } : {})
        },
        limit,
        offset,
        nest: true,
        raw: true
      }),
      Category.findAll({ raw: true })
    ])
      .then(([restaurants, categories]) => {
        const favoritedRestaurantsId = req.user?.FavoritedRestaurants
          ? req.user.FavoritedRestaurants.map(fr => fr.id)
          : []
        const likedRestaurantsId = req.user?.LikedRestaurants
          ? req.user.LikedRestaurants.map(lr => lr.id)
          : []
        const data = restaurants.rows.map(r => ({
          ...r,
          description: r.description.substring(0, 50),
          isFavorited: favoritedRestaurantsId.includes(r.id),
          isLiked: likedRestaurantsId.includes(r.id)
        }))
        return cb(null, {
          restaurants: data,
          categories,
          categoryId,
          pagination: getPagination(limit, page, restaurants.count)
        })
      })
      .catch(err => cb(err))
  },
  getRestaurant: (req, cb) => {
    return Restaurant.findByPk(req.params.id, {
      include: [
        Category,
        { model: Comment, include: User },
        { model: User, as: 'FavoritedUsers' },
        { model: User, as: 'LikedUsers' }
      ]
    })
      .then(restaurant => {
        if (!restaurant) throw new Error("This restaurant didn't exist.")

        return restaurant.increment('viewCount')
      })
      .then(restaurant => {
        const isFavorited = restaurant.FavoritedUsers.some(
          f => f.id === req.user.id
        )
        const isLiked = restaurant.LikedUsers.some(l => l.id === req.user.id)
        return cb(null, {
          restaurant: restaurant.toJSON(),
          isFavorited,
          isLiked
        })
      })
      .catch(err => cb(err))
  },
  getFeeds: (req, cb) => {
    return Promise.all([
      Restaurant.findAll({
        // 查最新的 10 筆新增的餐廳和新增的評論
        limit: 10,
        // order 接受的參數是一組正列，第一個放用來排序的欄位名稱，第二個參數放排列的方式
        order: [['createdAt', 'DESC']],
        include: [Category],
        raw: true,
        nest: true
      }),
      Comment.findAll({
        // 查最新的 10 筆新增的評論
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [User, Restaurant],
        raw: true,
        nest: true
      })
    ])
      .then(([restaurants, comments]) => {
        return cb(null, { restaurants, comments })
      })
      .catch(err => cb(err))
  },
  getDashboard: (req, cb) => {
    return Restaurant.findByPk(req.params.id, {
      include: Category,
      nest: true,
      raw: true
    })
      .then(restaurant => {
        if (!restaurant) throw new Error("This restaurant didn't exist.")
        return cb(null, { restaurant })
      })
      .catch(err => cb(err))
  },
  getTopRestaurants: (req, cb) => {
    // 撈出所有 Restaurant 與 User 資料
    return Restaurant.findAll({
      include: [{ model: User, as: 'FavoritedUsers' }]
    })
      .then(restaurants => {
        // 整理 restaurants 資料，把每個 restaurants 項目都拿出來處理一次，並把新陣列儲存在 restaurants 裡
        const result = restaurants
          .map(restaurant => ({
            // 整理格式
            ...restaurant.toJSON(),
            description:
              restaurant.description.length >= 100
                ? restaurant.description.substring(0, 97) + '...'
                : restaurant.description,
            // 計算收藏人數
            favoritedCount: restaurant.FavoritedUsers.length,
            // 目前登入的使用者所收藏的餐廳裡的 id，一個個比對是否等於現在資料傳進來 restaurant 的 id
            isFavorited:
              req.user &&
              req.user.FavoritedRestaurants.some(
                fr => fr.id === restaurant.id
              )
          }))
          // 根據 favoritedCount 把收藏多的餐廳排在前面
          .sort((a, b) => b.favoritedCount - a.favoritedCount)
          .slice(0, 10)
        return cb(null, { restaurants: result })
      })
      .catch(err => cb(err))
  }
}
module.exports = restaurantServices
