import express from "express";
import homeController from "../controllers/homeController";
import userController from '../controllers/userController';
import doctorController from "../controllers/doctorController";
import patientController from "../controllers/patientController";
import specialtyController from "../controllers/specialtyController";
import clinicController from "../controllers/clinicController";
import handbookController from "../controllers/handbookController";
import searchController from "../controllers/searchController";
import aiController from "../controllers/aiController";
import authenticateToken from "../middleware/authMiddleware";
import authorizeRoles from "../middleware/roleMiddleware";
import { ROLES } from "../config/roles";

let router = express.Router();

let initWebRoutes = (app) => {
    router.get("/", homeController.getHomePage);
    
    router.post('/api/login', userController.handleLogin);
    router.post('/api/refresh-token', userController.handleRefreshToken);
    router.post('/api/logout', userController.handleLogout);
    router.get('/api/get-all-users', authenticateToken, authorizeRoles(ROLES.ADMIN, ROLES.DOCTOR), userController.handleGetAllUsers);
    router.post('/api/create-new-user', authenticateToken, authorizeRoles(ROLES.ADMIN), userController.handleCreateNewUser);
    router.put('/api/edit-user', authenticateToken, authorizeRoles(ROLES.ADMIN), userController.handleEditUser);
    router.delete('/api/delete-user', authenticateToken, authorizeRoles(ROLES.ADMIN), userController.handleDeleteUser);

    router.get('/api/allcode', userController.getAllCode);

    router.get('/api/top-doctor-home', doctorController.getTopDoctorHome);
    router.get('/api/get-all-doctors', doctorController.getAllDoctors);
    router.post('/api/save-infor-doctors', authenticateToken, authorizeRoles(ROLES.DOCTOR, ROLES.ADMIN), doctorController.postInforDoctor);
    router.get('/api/get-detail-doctor-by-id', doctorController.getDetailDoctorById);
    router.get('/api/get-schedule-doctor-by-date', doctorController.getScheduleByDate);
    router.get('/api/get-extra-infor-doctor-by-id', doctorController.getExtraInforDoctorById);
    router.get('/api/get-profile-doctor-by-id', doctorController.getProfileDoctorById);
    
    router.post('/api/bulk-create-schedule', authenticateToken, authorizeRoles(ROLES.DOCTOR, ROLES.ADMIN), doctorController.bulkCreateSchedule);
    router.post('/api/edit-bulk-schedule', authenticateToken, authorizeRoles(ROLES.DOCTOR, ROLES.ADMIN), doctorController.editBulkSchedule);
    router.get('/api/get-list-patient-for-doctor', authenticateToken, authorizeRoles(ROLES.DOCTOR), doctorController.getListPatientForDoctor);
    router.post('/api/send-remedy', authenticateToken, authorizeRoles(ROLES.DOCTOR, ROLES.ADMIN), doctorController.sendRemedy);
    router.post('/api/cancel-appointment', authenticateToken, authorizeRoles(ROLES.DOCTOR, ROLES.ADMIN), doctorController.cancelAppointment);

    router.post('/api/patient-book-appointment', patientController.postBookAppointment);
    router.post('/api/verify-book-appointment', patientController.postVerifyBookAppointment);

    router.post('/api/create-new-specialty', authenticateToken, authorizeRoles(ROLES.ADMIN), specialtyController.createSpecialty);
    router.get('/api/get-specialty', specialtyController.getAllSpecialty);
    router.get('/api/get-detail-specialty-by-id', specialtyController.getDetailSpecialtyById);
    router.put('/api/specialty/:id', authenticateToken, authorizeRoles(ROLES.ADMIN), specialtyController.updateSpecialty);

    router.post('/api/create-new-clinic', authenticateToken, authorizeRoles(ROLES.ADMIN), clinicController.createClinic);
    router.get('/api/get-clinic', clinicController.getAllClinic);
    router.get('/api/get-detail-clinic-by-id', clinicController.getDetailClinicById);
    router.put('/api/clinic/:id', authenticateToken, authorizeRoles(ROLES.ADMIN), clinicController.updateClinic);

    // Search endpoint (search by doctor name or specialty)
    router.get('/api/search', searchController.search);

    //ai routes
    router.post('/api/suggest-specialty', aiController.suggestSpecialty);
    // Handbook categories
    router.get('/api/handbook/categories', handbookController.getAllCategories);
    router.get('/api/handbook/categories/:id', handbookController.getCategoryById);
    router.post('/api/handbook/categories', authenticateToken, authorizeRoles(ROLES.ADMIN), handbookController.createCategory);
    router.put('/api/handbook/categories/:id', authenticateToken, authorizeRoles(ROLES.ADMIN), handbookController.updateCategory);
    router.delete('/api/handbook/categories/:id', authenticateToken, authorizeRoles(ROLES.ADMIN), handbookController.deleteCategory);

    return app.use("/", router);
}

module.exports = initWebRoutes;