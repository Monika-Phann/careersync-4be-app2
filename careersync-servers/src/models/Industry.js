// src/models/Industry.model.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Industry = sequelize.define('Industry', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    industry_name: { type: DataTypes.STRING(255), allowNull: false, unique: true }
  }, {
    tableName: 'Industry',
    timestamps: true,
    paranoid: false,
    underscored: true,
  });

  Industry.associate = (models) => {
    Industry.hasMany(models.Position, { foreignKey: 'industry_id' });
    Industry.hasMany(models.Mentor, { foreignKey: 'industry_id' });
  };

  return Industry;
};