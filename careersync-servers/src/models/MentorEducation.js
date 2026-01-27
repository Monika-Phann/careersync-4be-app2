// src/models/MentorEducation.model.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MentorEducation = sequelize.define('MentorEducation', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    mentor_id: { type: DataTypes.UUID, allowNull: false },  // ✅ ADDED
    university_name: { type: DataTypes.STRING(255), allowNull: false },
    degree_name: { type: DataTypes.STRING(255), allowNull: false },
    field_of_study: DataTypes.STRING(255),
    year_graduated: { type: DataTypes.INTEGER, allowNull: false },
    grade_gpa: DataTypes.STRING(10),
    activities: DataTypes.TEXT,
    deleted_at: DataTypes.DATE
  }, {
    tableName: 'Mentor_Education',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [{ fields: ['mentor_id'] }]
  });

  MentorEducation.associate = (models) => {
    MentorEducation.belongsTo(models.Mentor, { foreignKey: 'mentor_id', onDelete: 'CASCADE' });
  };

  return MentorEducation;
};