module.exports = (sequelize, DataTypes) => {
  const ScheduleTimeslot = sequelize.define(
    "ScheduleTimeslot",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
      },

      mentor_id: {
        type: DataTypes.UUID,
        allowNull: false
      },

      session_id: {
        type: DataTypes.UUID,
        allowNull: false
      },

      start_time: {
        type: DataTypes.DATE,
        allowNull: false
      },

      end_time: {
        type: DataTypes.DATE,
        allowNull: false
      },

      is_booked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    },
    {
      tableName: "Schedule_Timeslot", // 🔥 THIS IS THE KEY FIX
      timestamps: true,
      underscored: true
    }
  );

  ScheduleTimeslot.associate = (models) => {
    ScheduleTimeslot.belongsTo(models.Mentor, {
      foreignKey: "mentor_id"
    });

    ScheduleTimeslot.belongsTo(models.Session, {
      foreignKey: "session_id",
      onDelete: "CASCADE"
    });

    // A timeslot can be associated with a booking via Booking.schedule_timeslot_id
    ScheduleTimeslot.hasOne(models.Booking, {
      foreignKey: "schedule_timeslot_id"
    });
  };

  return ScheduleTimeslot;
};
