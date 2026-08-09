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
router.post(
  ['/offerings/:courseOfferingId/schedule', '/course-offerings/:courseOfferingId/schedule'],
  validateRequest(schemas.setCourseScheduleSchema),
  controller.handleSetSchedule,
);
router.put(
  ['/offerings/:courseOfferingId/schedule', '/course-offerings/:courseOfferingId/schedule'],
  validateRequest(schemas.setCourseScheduleSchema),
  controller.handleSetSchedule,
);
router.delete(['/offerings/:courseOfferingId/schedule', '/course-offerings/:courseOfferingId/schedule'], controller.handleDeleteSchedule);

// --- Syllabus ---
router.post(
  ['/offerings/:courseOfferingId/syllabus', '/course-offerings/:courseOfferingId/syllabus'],
  validateRequest(schemas.setCourseSyllabusSchema),
  controller.handleSetSyllabus,
);
router.put(
  ['/offerings/:courseOfferingId/syllabus', '/course-offerings/:courseOfferingId/syllabus'],
  validateRequest(schemas.setCourseSyllabusSchema),
  controller.handleSetSyllabus,
);
router.delete(['/offerings/:courseOfferingId/syllabus', '/course-offerings/:courseOfferingId/syllabus'], controller.handleDeleteSyllabus);

// --- Materials ---
router.post(
  ['/offerings/:courseOfferingId/materials', '/course-offerings/:courseOfferingId/materials'],
  validateRequest(schemas.addCourseMaterialsSchema),
  controller.handleAddMaterials,
);
router.delete(
  ['/offerings/:courseOfferingId/materials/:materialId', '/course-offerings/:courseOfferingId/materials/:materialId'],
  controller.handleDeleteMaterial,
);

// --- Student Roster & Grading ---
router.get(['/offerings/:courseOfferingId/students', '/course-offerings/:courseOfferingId/students'], controller.handleGetEnrolledStudents);
router.post(
  ['/offerings/:courseOfferingId/grades', '/course-offerings/:courseOfferingId/grades'],
  validateRequest(schemas.submitGradesSchema),
  controller.handleSubmitGrades,
);

export default router;
