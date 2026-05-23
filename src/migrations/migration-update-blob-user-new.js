module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Use raw ALTER TABLE with USING clause to safely convert base64 strings to bytea.
        // Non-base64 values will be set to NULL to avoid cast errors.
        const sql = `ALTER TABLE "Users" ALTER COLUMN "image" TYPE bytea USING (
            CASE
                WHEN "image" ~ '^[A-Za-z0-9+/=\\n\\r]+$' THEN decode(regexp_replace("image", '\\\\s+', '', 'g'), 'base64')
                ELSE NULL
            END
        );`;
        return queryInterface.sequelize.transaction(async (t) => {
            await queryInterface.sequelize.query(sql, { transaction: t });
        });
    },

    down: async (queryInterface, Sequelize) => {
        // Convert bytea back to base64 string; NULLs remain NULL.
        const sql = `ALTER TABLE "Users" ALTER COLUMN "image" TYPE text USING (
            CASE
                WHEN "image" IS NOT NULL THEN encode("image", 'base64')
                ELSE NULL
            END
        );`;
        return queryInterface.sequelize.transaction(async (t) => {
            await queryInterface.sequelize.query(sql, { transaction: t });
        });
    }
};
