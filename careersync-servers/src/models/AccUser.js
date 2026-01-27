// src/models/AccUser.model.js
const { DataTypes } = require('sequelize');
const enums = require('./enum');

module.exports = (sequelize) => {
  const AccUser = sequelize.define('AccUser', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    
    // ADDED — critical foreign key
    user_id: { type: DataTypes.UUID, allowNull: false, unique: true },

    first_name: { type: DataTypes.STRING(255), allowNull: false },
    last_name: { type: DataTypes.STRING(255), allowNull: false },
    phone: { type: DataTypes.STRING(20), allowNull: false },
    gender: { type: DataTypes.ENUM(...enums.Gender), allowNull: false },
    dob: { type: DataTypes.DATEONLY, allowNull: false },
    types_user: { type: DataTypes.ENUM(...enums.AccUserType), allowNull: false },
    institution_name: { type: DataTypes.STRING(255), allowNull: false },
    profile_image: { type: DataTypes.STRING(255), allowNull: false },
    deleted_at: DataTypes.DATE
  }, {
    tableName: 'Acc_User',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [{ fields: ['user_id'] }]
  });

  AccUser.associate = (models) => {
    AccUser.belongsTo(models.User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
    AccUser.hasMany(models.Booking, { foreignKey: 'acc_user_id' });
  };

  return AccUser;
};