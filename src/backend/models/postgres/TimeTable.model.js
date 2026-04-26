import { DataTypes } from "sequelize";
import sequelize from "../../config/database.js";

const TimeTable = sequelize.define(
  "TimeTable",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    day: {
      type: DataTypes.ENUM(
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ),
      allowNull: false,
    },
    start_time: { type: DataTypes.TIME, allowNull: false },
    end_time: { type: DataTypes.TIME, allowNull: false },
    room_no: { type: DataTypes.STRING },
    branch_id: { type: DataTypes.UUID, allowNull: false },
    academic_year_id: { type: DataTypes.UUID, allowNull: false },
    group_id: { type: DataTypes.UUID, allowNull: false },
    class_id: { type: DataTypes.UUID, allowNull: false },
    section_id: { type: DataTypes.UUID, allowNull: false },
    teacher_id: { type: DataTypes.UUID, allowNull: false },
    subject_id: { type: DataTypes.UUID, allowNull: false },
    created_by: { type: DataTypes.UUID, allowNull: false },
  },
  {
    tableName: "timetables",
    timestamps: true,
    underscored: true,
    paranoid: true,
  },
);

TimeTable.associate = (models) => {
  TimeTable.belongsTo(models.User, { foreignKey: "teacher_id", as: "teacher" });
  TimeTable.belongsTo(models.Class, { foreignKey: "class_id", as: "class" });
  TimeTable.belongsTo(models.Section, {
    foreignKey: "section_id",
    as: "section",
  });
  TimeTable.belongsTo(models.Subject, {
    foreignKey: "subject_id",
    as: "subject",
  });
  TimeTable.belongsTo(models.Group, { foreignKey: "group_id", as: "group" });
};

export default TimeTable;
