// src/models/PasswordReset.model.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PasswordReset = sequelize.define('PasswordReset', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.UUID, allowNull: false },  // ✅ ADDED
    row_num: { type: DataTypes.INTEGER, unique: true },
    reset_token: { type: DataTypes.TEXT, allowNull: false, unique: true },
    expires_at: DataTypes.DATE,
    deleted_at: DataTypes.DATE
  }, {
    tableName: 'Password_Reset',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { unique: true, fields: ['reset_token'] }
    ]
  });

  PasswordReset.associate = (models) => {
    PasswordReset.belongsTo(models.User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
  };

  return PasswordReset;
};