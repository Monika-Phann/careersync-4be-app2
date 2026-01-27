// src/models/MentorDocument.model.js
const { DataTypes } = require('sequelize');
const enums = require('./enum');

module.exports = (sequelize) => {
  const MentorDocument = sequelize.define('MentorDocument', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    mentor_id: { type: DataTypes.UUID, allowNull: false },  // ✅ ADDED
    document_type: { type: DataTypes.ENUM(...enums.DocumentType), allowNull: false, defaultValue: 'cv' },
    document_url: { type: DataTypes.TEXT, allowNull: false },
    is_primary_cv: { type: DataTypes.BOOLEAN, defaultValue: false },
    deleted_at: DataTypes.DATE
  }, {
    tableName: 'Mentor_Documents',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [{ fields: ['mentor_id'] }]
  });

  MentorDocument.associate = (models) => {
    MentorDocument.belongsTo(models.Mentor, { foreignKey: 'mentor_id', onDelete: 'CASCADE' });
  };

  return MentorDocument;
};