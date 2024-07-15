const { Restaurant, Category, Comment, User, Favorite } = require("../../models");
const restaurantServices = require("../../services/restaurant-services");
const restaurantController = {
  getRestaurants: (req, res, next) => {
    restaurantServices.getRestaurants(req, (err, data) => err ? next(err) : res.render('restaurants', data))
  },

  getRestaurant: (req, res, next) => {
    return Restaurant.findByPk(req.params.id, {
      include: [
        Category,
        { model: Comment, include: User },
        { model: User, as: "FavoritedUsers" },
        { model: User, as: "LikedUsers" },
      ],
    })
      .then((restaurant) => {
        if (!restaurant) throw new Error("This restaurant didn't exist.");

        return restaurant.increment("viewCount");
      })
      .then((restaurant) => {
        const isFavorited = restaurant.FavoritedUsers.some(
          (f) => f.id === req.user.id
        );
        const isLiked = restaurant.LikedUsers.some((l) => l.id === req.user.id);
        return res.render("restaurant", {
          restaurant: restaurant.toJSON(),
          isFavorited,
          isLiked,
        });
      })
      .catch((err) => next(err));
  },
  getDashboard: (req, res, next) => {
    return Restaurant.findByPk(req.params.id, {
      include: Category,
      nest: true,
      raw: true,
    })
      .then((restaurant) => {
        if (!restaurant) throw new Error("This restaurant didn't exist.");

        return res.render("dashboard", { restaurant });
      })
      .catch((err) => next(err));
  },
  getFeeds: (req, res, next) => {
    return Promise.all([
      Restaurant.findAll({
        // 查最新的 10 筆新增的餐廳和新增的評論
        limit: 10,
        // order 接受的參數是一組正列，第一個放用來排序的欄位名稱，第二個參數放排列的方式
        order: [["createdAt", "DESC"]],
        include: [Category],
        raw: true,
        nest: true,
      }),
      Comment.findAll({
        // 查最新的 10 筆新增的評論
        limit: 10,
        order: [["createdAt", "DESC"]],
        include: [User, Restaurant],
        raw: true,
        nest: true,
      }),
    ])
      .then(([restaurants, comments]) => {
        res.render("feeds", {
          restaurants,
          comments,
        });
      })
      .catch((err) => next(err));
  },
  getTopRestaurants: (req, res, next) => {
    // 撈出所有 Restaurant 與 User 資料
    return Restaurant.findAll({
      include: [{ model: User, as: "FavoritedUsers" }],
    })
      .then((restaurants) => {
        // 整理 restaurants 資料，把每個 restaurants 項目都拿出來處理一次，並把新陣列儲存在 restaurants 裡
        const result = restaurants
          .map((restaurant) => ({
            // 整理格式
            ...restaurant.toJSON(),
            description:
              restaurant.description.length >= 100
                ? restaurant.description.substring(0, 97) + "..."
                : restaurant.description,
            // 計算收藏人數
            favoritedCount: restaurant.FavoritedUsers.length,
            // 目前登入的使用者所收藏的餐廳裡的 id，一個個比對是否等於現在資料傳進來 restaurant 的 id
            isFavorited:
              req.user && req.user.FavoritedRestaurants.some(
                (fr) => fr.id === restaurant.id
              ),
          }))
          // 根據 favoritedCount 把收藏多的餐廳排在前面
          .sort((a, b) => b.favoritedCount - a.favoritedCount)
          .slice(0, 10);
        res.render("top-restaurants", { restaurants: result });
      })
      .catch((err) => next(err));
  },
};
module.exports = restaurantController;
