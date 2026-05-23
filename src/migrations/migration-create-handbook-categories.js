'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('handbook_categories', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      nameVi: {
        type: Sequelize.STRING
      },
      nameEn: {
        type: Sequelize.STRING
      },
      descriptionHTML: {
        type: Sequelize.TEXT
      },
      descriptionMarkdown: {
        type: Sequelize.TEXT
      },
      specialtyId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Specialties',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      image: {
        type: Sequelize.BLOB('long')
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('handbook_categories');
  }
};
