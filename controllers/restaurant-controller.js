const { Restaurant, Category } = require("../models");
const restaurantController = {
  getRestaurants: (req, res) => {
    return Restaurant.findAll({
      include: Category,
      nest: true,
      raw: true,
    }).then((restaurants) => {
      const data = restaurants.map((r) => ({
        ...r,
        description: r.description.substring(0, 50),
      }));
      return res.render("restaurants", {
        restaurants: data,
      });
    });
  },
  getRestaurant: (req, res, next) => {
    return Restaurant.findByPk( req.params.id, {
      include: Category,
      nest: true,
      raw: true,
    })
      .then((restaurant) => {
        if(!restaurant) throw new error("This restaurant didn't exist.")
        return res.render("restaurant", { restaurant });
      })
      .catch(err => next(err))
  },
  getDashboard: (req, res, next) => {
    let viewCount = 0; // 初始化瀏覽次數
    return Restaurant.findByPk(req.params.id, {
      include: Category,
      nest: true,
      raw: true,
    })
      .then((restaurant) => {
        if (!restaurant) throw new error("This restaurant didn't exist.");

        viewCount++;
        return res.render("dashboard", {
          restaurant,
          viewCount
        });
      })
      .catch((err) => next(err));
  }
} 
module.exports = restaurantController;
