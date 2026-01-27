// src/models/Session.model.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Session = sequelize.define('Session', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    
    // ADDED — critical foreign keys
    mentor_id: { type: DataTypes.UUID, allowNull: false },
    position_id: { type: DataTypes.UUID, allowNull: false },

    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    agenda_pdf: DataTypes.STRING,
    location_name: { type: DataTypes.STRING(255), allowNull: false },
    location_map_url: { type: DataTypes.TEXT, allowNull: false },
    is_available: { type: DataTypes.BOOLEAN, defaultValue: true },
    deleted_at: DataTypes.DATE
  }, {
    tableName: 'Session',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      { fields: ['mentor_id'] },
      { fields: ['position_id'] },
      { fields: ['is_available'] }
    ]
  });

  Session.associate = (models) => {
    Session.belongsTo(models.Mentor, { foreignKey: 'mentor_id', onDelete: 'CASCADE' });
    Session.belongsTo(models.Position, { foreignKey: 'position_id' });
    Session.hasMany(models.ScheduleTimeslot, { foreignKey: 'session_id', onDelete: 'CASCADE' });
    Session.hasMany(models.Booking, { foreignKey: 'session_id' });
  };

  return Session;
};