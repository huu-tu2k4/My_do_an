'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tables = [
      'allcodes',
      'markdowns',
      'doctor_clinic_specialty',
      'doctor_infor',
      'specialties',
      'clinics',
      'histories',
      'bookings',
      'handbook_categories',
      'schedules'
    ];

    return queryInterface.sequelize.transaction(async (t) => {
      for (const oldName of tables) {
        const newName = oldName.charAt(0).toUpperCase() + oldName.slice(1);
        try {
          // check if old table exists
          const [[exists]] = await queryInterface.sequelize.query(
            `SELECT to_regclass('public."${oldName}"') IS NOT NULL AS exists`,
            { transaction: t }
          );
          if (exists && exists.exists) {
            await queryInterface.renameTable({ tableName: oldName }, { tableName: newName }, { transaction: t });
          }
        } catch (err) {
          // log and continue
          // eslint-disable-next-line no-console
          console.warn(`Could not rename table ${oldName} -> ${newName}:`, err.message || err);
        }
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    const tables = [
      'allcodes',
      'markdowns',
      'doctor_clinic_specialty',
      'doctor_infor',
      'specialties',
      'clinics',
      'histories',
      'bookings',
      'handbook_categories',
      'schedules'
    ];

    return queryInterface.sequelize.transaction(async (t) => {
      for (const oldName of tables) {
        const newName = oldName.charAt(0).toUpperCase() + oldName.slice(1);
        try {
          // check if capitalized table exists
          const [[exists]] = await queryInterface.sequelize.query(
            `SELECT to_regclass('public."${newName}"') IS NOT NULL AS exists`,
            { transaction: t }
          );
          if (exists && exists.exists) {
            await queryInterface.renameTable({ tableName: newName }, { tableName: oldName }, { transaction: t });
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn(`Could not rename table ${newName} -> ${oldName}:`, err.message || err);
        }
      }
    });
  }
};
