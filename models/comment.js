'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class Comment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate (models) {
      Comment.belongsTo(models.Restaurant, { foreignkey: 'restaurantId' })
      Comment.belongsTo(models.User, { foreignkey: 'userId' })
    }
  };
  Comment.init({
    text: DataTypes.STRING,
    userId: DataTypes.INTEGER,
    restaurantId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Comment',
    underscored: true
  })
  return Comment
}
