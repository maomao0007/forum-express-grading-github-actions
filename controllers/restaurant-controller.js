const { Restaurant, Category } = require("../models");
const restaurantController = {
  getRestaurants: (req, res, next) => {
    const categoryId = Number(req.query.categoryId) || ""; // 新增這裡，從網址上拿下來的參數是字串，先轉成 Number 再操作
    return Promise.all([
      Restaurant.findAll({
        include: Category,
        where: {
          ...(categoryId ? { categoryId } : {}), // 檢查 categoryId 是否為空值
        },
        nest: true,
        raw: true,
      }),
      Category.findAll({ raw: true }),
    ])
      .then(([restaurants, categories]) => {
        const data = restaurants.map((r) => ({
          ...r,
          description: r.description.substring(0, 50),
        }));
        return res.render("restaurants", {
          restaurants: data,
          categories,
          categoryId,
        });
      })
      .catch((err) => next(err)); 
  },
  getRestaurant: (req, res, next) => {
    return Restaurant.findByPk(req.params.id, {
      include: Category,
    })
      .then((restaurant) => {
        if (!restaurant) throw new Error("This restaurant didn't exist.");

        return restaurant.increment("viewCount");
      })
      .then((restaurant) => {
        return res.render("restaurant", {
          restaurant: restaurant.toJSON(),
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
}; 
module.exports = restaurantController;
