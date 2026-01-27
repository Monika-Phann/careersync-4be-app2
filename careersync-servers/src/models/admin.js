// src/models/Admin.model.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Admin = sequelize.define('Admin', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.UUID, allowNull: false, unique: true },  // ✅ ADDED
    full_name: { type: DataTypes.STRING(255) },
    phone: { type: DataTypes.STRING(50) },
    profile_image: { type: DataTypes.STRING },
    deleted_at: { type: DataTypes.DATE }
  }, {
    tableName: 'Admin',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [{ fields: ['user_id'] }]
  });

  Admin.associate = (models) => {
    Admin.belongsTo(models.User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
    Admin.hasMany(models.Mentor, { foreignKey: 'approved_by' });
  };

  return Admin;
};