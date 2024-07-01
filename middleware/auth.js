// const { ensureAuthenticated, getUser } = require("../helpers/auth-helpers");
const helpers = require("../helpers/auth-helpers");
const authenticated = (req, res, next) => {
  // 檢查使用者是否已經通過身份驗證
  // if (req.isAuthenticated)
  // if (ensureAuthenticated(req)) {
    if (helpers.ensureAuthenticated(req)) {
      // 如果已經通過身份驗證，調用 next() 繼續處理請求
      return next();
    }
  // 如果沒有通過身份驗證，則重定向到登入頁面 '/signin'
  res.redirect("/signin");
};

const authenticatedAdmin = (req, res, next) => {
  // 檢查使用者是否已經通過身份驗證
  // if (req.isAuthenticated)
  // if (ensureAuthenticated(req)) {
    if (helpers.ensureAuthenticated(req)) {
    // 如果已經通過身份驗證，進一步檢查使用者是否具有管理員權限
    // if (getUser(req).isAdmin) {
      if (helpers.getUser(req).isAdmin) {
      // 如果是管理員，則調用 next() 繼續處理請求
      return next();
    }
    // 如果不是管理員，則重定向到主頁面 '/'
    res.redirect("/");
  } else {
    // 如果沒有通過身份驗證，則重定向到登入頁面 '/signin'
    res.redirect("/signin");
  }
};
module.exports = {
  authenticated,
  authenticatedAdmin,
};
