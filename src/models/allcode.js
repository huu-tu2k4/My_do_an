'use strict';
const {
  Model
} = require('sequelize');
const { values } = require('sequelize/types/lib/operators');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  Allcode.init({
    key: DataTypes.STRING,
    type: DataTypes.STRING,
    valueEn: DataTypes.STRING,
    valueVi: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Allcode',
    tableName: 'Allcode',           
    timestamps: true              
  });
  return Allcode;
};