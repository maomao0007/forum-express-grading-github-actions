const { Category } = require("../models");
const categoryController = {
  getCategories: (req, res, next) => {
    return Promise.all([
      Category.findAll({ raw: true }),
      req.params.id ? Category.findByPK(req.params.id, { raw:true }) : null])
      .then(([categories, category]) => res.render("admin/categories", { categories,category }))
      .catch((err) => next(err));
  },
  postCategory: (req, res, next) => {
    const { name } = req.body
    if (!name) throw new Error("Category name is required!");
    
    return Category.create({ name })
      .then(() => res.redirect("/admin/categories"))
      .catch((err) => next(err));
  },
  putCategory: (req, res, next) => {
    const { name } = req.body
    if (!name) throw new Error("Category name is required!");
    
    return Category.findByPK(req.params.id)
      .then(category => {
        if (!category) throw new error("Category doesn't exist!")
        return category.update({ name })
      })
      .then(() => res.redirect("/admin/categories"))
      .catch((err) => next(err));
  }
}  
module.exports = categoryController;