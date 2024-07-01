const { Restaurant, User } = require("../models"); 
const { localFileHandler } = require('../helpers/file-helpers') // 將 file-helper

const adminController = {
  getRestaurants: (req, res, next) => {
    return Restaurant.findAll({
      raw: true,
    })
      .then((restaurants) => res.render("admin/restaurants", { restaurants }))
      .catch((err) => next(err));
  },
  createRestaurant: (req, res) => {
    return res.render("admin/create-restaurant");
  },
  postRestaurant: (req, res, next) => {
    const { name, tel, address, openingHours, description } = req.body;
    if (!name) throw new Error("Restaurant name is required!");
    const { file } = req; // 把檔案取出來
    return localFileHandler(file)
      .then((filePath) =>
        Restaurant.create({
          name,
          tel,
          address,
          openingHours,
          description,
          image: filePath || null,
        })
      )
      .then(() => {
        req.flash("success_messages", "restaurant was successfully created");
        res.redirect("/admin/restaurants");
      })
      .catch((err) => next(err));
  },
  getRestaurant: (req, res, next) => {
    return Restaurant
      .findByPk(req.params.id, {
        //去資料庫用 id 找一筆資料
        raw: true, // 找到以後整理格式再回傳
      })
      .then((restaurant) => {
        if (!restaurant) throw new Error("Restaurant didn't exist!"); //  如果找不到，回傳錯誤訊息，後面不執行
        res.render("admin/restaurant", { restaurant });
      })
      .catch((err) => next(err));
  },
  editRestaurant: (req, res, next) => {
    return Restaurant
      .findByPk(req.params.id, {
        raw: true,
      })
      .then((restaurant) => {
        if (!restaurant) throw new Error("Restaurant didn't exist!");
        res.render("admin/edit-restaurant", { restaurant });
      })
      .catch((err) => next(err));
  },
  putRestaurant: (req, res, next) => {
    const { name, tel, address, openingHours, description } = req.body;
    if (!name) throw new Error("Restaurant name is required!");
    const { file } = req;

    return Promise
      .all([Restaurant.findByPk(req.params.id), localFileHandler(file)])
      .then(([restaurant, filePath]) => {
        if (!restaurant) throw new Error("Restaurant didn't exist!");

        return restaurant.update({
          name,
          tel,
          address,
          openingHours,
          description,
          image: filePath || restaurant.image,
        });
      })
      .then(() => {
        req.flash("success_messages", "restaurant was successfully to update");
        res.redirect("/admin/restaurants");
      })
      .catch((err) => next(err));
  },

  deleteRestaurant: (req, res, next) => {
    return Restaurant.findByPk(req.params.id)
      .then((restaurant) => {
        if (!restaurant) throw new Error("Restaurant didn't exist!");
        return restaurant.destroy();
      })
      .then(() => res.redirect("/admin/restaurants"))
      .catch((err) => next(err));
  },

 getUsers: (req, res, next) => {
  return User.findAll({ raw: true,
    })
      .then((users) => res.render("admin/users", { users }))
      .catch((err) => next(err));
  },

 patchUser: (req, res, next) => {
   return User.findByPk(req.params.id)
     .then((user) => {
       if (!user) throw new Error("User didn't exist!");

       // 檢查當前登錄用戶是否為管理員
       if (!req.user.isAdmin) {
         throw new Error("Only admins are able to edit user roles.");
       }
       // 根據設計，root (ID 為 1 的使用者) 的 admin 權限無法被自己和其他用戶更改
       if (user.id === 1) {
         throw new Error(
           "The superuser (root) role cannot be edited by anyone."
         );
       }

       // 切換 isAdmin 狀態
       return user.update({ isAdmin: !user.isAdmin });
     })
     .then((updatedUser) => {
       req.flash(
         "success_messages",
         `User role updated to ${updatedUser.isAdmin ? "Admin" : "User"}`
       );
       res.redirect("/admin/users");
     })
     .catch((err) => next(err));
 }
}

module.exports = adminController;
