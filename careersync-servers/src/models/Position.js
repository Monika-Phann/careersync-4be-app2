// src/models/Position.model.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Position = sequelize.define('Position', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    industry_id: { type: DataTypes.UUID },  // ✅ ADDED
    position_name: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    image_position: DataTypes.STRING,
    description: DataTypes.TEXT
  }, {
    tableName: 'Position',
    timestamps: true,
    paranoid: false,
    underscored: true,
    indexes: [{ fields: ['industry_id'] }]
  });

  Position.associate = (models) => {
    Position.belongsTo(models.Industry, { foreignKey: 'industry_id' });
    Position.hasMany(models.Mentor, { foreignKey: 'position_id' });
    Position.hasMany(models.Session, { foreignKey: 'position_id' });
    Position.hasMany(models.Booking, { foreignKey: 'position_id' });
    Position.hasMany(models.Certificate, { foreignKey: 'position_id' });
  };

  return Position;
};