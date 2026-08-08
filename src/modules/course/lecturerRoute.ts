import express from 'express';
import { requireAuth, requireRole, ROLES } from '../../middlewares/authMiddleware';
import { validateRequest } from '../../utils/validation';
import * as schemas from './courseSchemas';
import * as controller from './courseController';

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(ROLES.LECTURER));

// --- Lecturer Dashboard ---
// GET /api/v1/lecturer/my-courses
router.get('/my-courses', controller.handleGetLecturerCourses);

// --- Schedule ---
// POST   /api/v1/lecturer/offerings/:courseOfferingId/schedule
// PUT    /api/v1/lecturer/offerings/:courseOfferingId/schedule
// DELETE /api/v1/lecturer/offerings/:courseOfferingId/schedule
router.post(
  '/offerings/:courseOfferingId/schedule',
  validateRequest(schemas.setCourseScheduleSchema),
  controller.handleSetSchedule,
);
router.put(
  '/offerings/:courseOfferingId/schedule',
  validateRequest(schemas.setCourseScheduleSchema),
  controller.handleSetSchedule,
);
router.delete('/offerings/:courseOfferingId/schedule', controller.handleDeleteSchedule);

// --- Syllabus ---
// POST   /api/v1/lecturer/offerings/:courseOfferingId/syllabus
// PUT    /api/v1/lecturer/offerings/:courseOfferingId/syllabus
// DELETE /api/v1/lecturer/offerings/:courseOfferingId/syllabus
router.post(
  '/offerings/:courseOfferingId/syllabus',
  validateRequest(schemas.setCourseSyllabusSchema),
  controller.handleSetSyllabus,
);
router.put(
  '/offerings/:courseOfferingId/syllabus',
  validateRequest(schemas.setCourseSyllabusSchema),
  controller.handleSetSyllabus,
);
router.delete('/offerings/:courseOfferingId/syllabus', controller.handleDeleteSyllabus);

// --- Materials ---
// POST   /api/v1/lecturer/offerings/:courseOfferingId/materials
// DELETE /api/v1/lecturer/offerings/:courseOfferingId/materials/:materialId
router.post(
  '/offerings/:courseOfferingId/materials',
  validateRequest(schemas.addCourseMaterialsSchema),
  controller.handleAddMaterials,
);
router.delete(
  '/offerings/:courseOfferingId/materials/:materialId',
  controller.handleDeleteMaterial,
);

// --- Student Roster & Grading ---
// GET  /api/v1/lecturer/offerings/:courseOfferingId/students
// POST /api/v1/lecturer/offerings/:courseOfferingId/grades
router.get('/offerings/:courseOfferingId/students', controller.handleGetEnrolledStudents);
router.post(
  '/offerings/:courseOfferingId/grades',
  validateRequest(schemas.submitGradesSchema),
  controller.handleSubmitGrades,
);

export default router;
