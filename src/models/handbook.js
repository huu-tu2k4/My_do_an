'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Handbook extends Model {
    static associate(models) {
      Handbook.belongsTo(models.Specialty, { foreignKey: 'specialtyId', as: 'specialtyData' });
    }
  };
  Handbook.init({
    nameVi: DataTypes.STRING,
    nameEn: DataTypes.STRING,
    descriptionHTML: DataTypes.TEXT,
    descriptionMarkdown: DataTypes.TEXT,
    image: DataTypes.TEXT,
    specialtyId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Handbook',
    tableName: 'Handbook_categories'
  });
  return Handbook;
};
