const express = require('express');
const router = express.Router();
const filteredResults = require('../middleware/filteredResults');
const Course = require('../models/Course');

const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  courseUploadPhoto
} = require('../controllers/courses');

const { protect, authorize } = require('../middleware/auth');

const reviewRouter = require('./reviews');
router.use('/:id/reviews', reviewRouter);

router.route('/')
  .get(filteredResults(Course), getCourses)
  .post(protect, authorize('publisher', 'admin'), createCourse);

router.route('/:id')
  .get(getCourse)
  .put(protect, authorize('publisher', 'admin'), updateCourse)
  .delete(protect, authorize('publisher', 'admin'), deleteCourse);

router.route('/:id/photo').put(protect, authorize('publisher', 'admin'), courseUploadPhoto);

module.exports = router;
