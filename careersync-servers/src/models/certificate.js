// src/models/Certificate.model.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Certificate = sequelize.define('Certificate', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    booking_id: { type: DataTypes.UUID },
    position_id: { type: DataTypes.UUID },  
    acc_user_id: { type: DataTypes.UUID },  
    mentor_id: { type: DataTypes.UUID },  
    issued_by: { type: DataTypes.UUID }, 
    issue_date: { type: DataTypes.DATEONLY, allowNull: false },
    certificate_number: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    deleted_at: DataTypes.DATE
  }, {
    tableName: 'Certificate',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['certificate_number'] },
      { fields: ['acc_user_id'] },
      { fields: ['mentor_id'] },
      { fields: ['booking_id'] }
    ]
  });

  Certificate.associate = (models) => {
    Certificate.belongsTo(models.Booking, { foreignKey: 'booking_id' });
    Certificate.belongsTo(models.Position, { foreignKey: 'position_id' });
    Certificate.belongsTo(models.AccUser, { foreignKey: 'acc_user_id' });
    Certificate.belongsTo(models.Mentor, { foreignKey: 'mentor_id' });
    Certificate.belongsTo(models.Mentor, { as: 'Issuer', foreignKey: 'issued_by' });
  };

  return Certificate;
};