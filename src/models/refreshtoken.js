'use strict';
module.exports = (sequelize, DataTypes) => {
  const RefreshToken = sequelize.define('RefreshToken', {
    token: DataTypes.STRING,
    userId: DataTypes.INTEGER,
    expiresAt: DataTypes.DATE,
    revoked: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, {});
  // ensure table name matches DB
  RefreshToken.tableName = 'RefreshTokens';
  RefreshToken.associate = function(models) {
    RefreshToken.belongsTo(models.User, { foreignKey: 'userId' });
  };
  return RefreshToken;
};
