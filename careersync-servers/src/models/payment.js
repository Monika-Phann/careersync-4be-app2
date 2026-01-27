// src/models/Payment.model.js
const { DataTypes } = require('sequelize');
const enums = require('./enum');

module.exports = (sequelize) => {
  const Payment = sequelize.define('Payment', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    booking_id: { type: DataTypes.UUID, allowNull: false, unique: true },  
    amount: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    commission: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    transaction_id: DataTypes.STRING(255),
    pay_date: DataTypes.DATE,
    status: { type: DataTypes.ENUM(...enums.PaymentStatus), allowNull: false, defaultValue: 'pending' },
    deleted_at: DataTypes.DATE
  }, {
    tableName: 'Payment',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      { fields: ['booking_id'] },
      { fields: ['status'] }
    ]
  });

  Payment.associate = (models) => {
    Payment.belongsTo(models.Booking, { foreignKey: 'booking_id', onDelete: 'CASCADE' });
    Payment.hasOne(models.Invoice, { foreignKey: 'payment_id', onDelete: 'CASCADE' });
  };

  return Payment;
};