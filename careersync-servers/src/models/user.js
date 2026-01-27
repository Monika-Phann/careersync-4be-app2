// src/models/User.model.js
const { DataTypes } = require('sequelize');
const enums = require('./enum');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    password: { type: DataTypes.TEXT, allowNull: false },
    role_name: { type: DataTypes.ENUM(...enums.UserRole), allowNull: false, defaultValue: 'acc_user' },
    status: { type: DataTypes.ENUM(...enums.AccountStatus), allowNull: false, defaultValue: 'pending' },
    email_verified_at: { type: DataTypes.DATE },
    last_login: { type: DataTypes.DATE },
    last_password_change: { type: DataTypes.DATE },
    //deleted_at: { type: DataTypes.DATE },
    created_by: { type: DataTypes.UUID, allowNull: true }, // Admin who created this user
    
    // CHANGED: Use snake_case to match underscored: true
    verify_token: { type: DataTypes.STRING, allowNull: true },
    verify_token_exp: { type: DataTypes.DATE, allowNull: true },
    email_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
    reset_token: { type: DataTypes.STRING, allowNull: true },
    reset_token_exp: { type: DataTypes.DATE, allowNull: true },
    refresh_token: { type: DataTypes.TEXT, allowNull: true }
  }, {
    tableName: 'Users',
    timestamps: true,
  
    underscored: true, // This converts all field names to snake_case
    indexes: [
      { unique: true, fields: ['email'] },
      { fields: ['role_name'] },
      { fields: ['status'] },
      { fields: ['verify_token'] },  // CHANGED: camelCase -> snake_case
      { fields: ['reset_token'] }     // CHANGED: camelCase -> snake_case
    ]
  });

  User.associate = (models) => {
    User.hasOne(models.Admin, { foreignKey: 'user_id', onDelete: 'CASCADE' });
    User.hasOne(models.Mentor, { foreignKey: 'user_id', onDelete: 'CASCADE' });
    User.hasOne(models.AccUser, { foreignKey: 'user_id', onDelete: 'CASCADE' });
    User.hasMany(models.LoginSession, { foreignKey: 'user_id', onDelete: 'CASCADE' });
    User.hasMany(models.PasswordReset, { foreignKey: 'user_id', onDelete: 'CASCADE' });
    
    // Self-referential: Track who created this user
    User.belongsTo(models.User, { as: 'creator', foreignKey: 'created_by' });
  };

  return User;
};