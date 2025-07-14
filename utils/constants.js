const DAYS_OF_WEEK = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

const AGE_CATEGORY = {
  KIDS: 'kids',
  ADULTS: 'adults',
};

const ALLOWED_STATUS = {
  APPROVED: 'approved',
  PENDING: 'pending',
  REJECTED: 'rejected',
  N_A: 'n/a',
};

const USER_TYPES = {
  ADMIN: 'admin_staff',
  PROFESSOR: 'professor',
  TEACHER: 'teacher', 
  STUDENT: 'student',
  FINANCIAL: 'financial',
  COORDINATOR: 'coordinator',
  RECEPTIONIST: 'receptionist',
};

const EXAMS_TYPE = {
  STARTERS: 'STARTERS',
  MOVERS: 'MOVERS',
  FLYERS: 'FLYERS',
  KEY: 'KEY',
  PRELIM: 'PRELIM',
  FIRST: 'FIRST',
};

const EXAM_MODULES = {
  THREE_MODULES: {
    READING_WRITING: 'reading-and-writing',
    LISTENING: 'listening-yle',
    SPEAKING: 'speaking-yle'
  },
  FOUR_MODULES: {
    READING: 'reading',
    LISTENING: 'listening',
    WRITING: 'writing',
    SPEAKING: 'speaking'
  }
};

const EXAM_TYPE_MODULES = {
  [EXAMS_TYPE.STARTERS]: 3,
  [EXAMS_TYPE.MOVERS]: 3,
  [EXAMS_TYPE.FLYERS]: 3,
  [EXAMS_TYPE.KEY]: 3,
  [EXAMS_TYPE.PRELIM]: 4,
  [EXAMS_TYPE.FIRST]: 4,
};

const LEVEL_TO_EXAM_TYPE = {
  1: EXAMS_TYPE.MOVERS,     
  2: EXAMS_TYPE.KEY,       
  3: EXAMS_TYPE.PRELIM,     
  4: EXAMS_TYPE.PRELIM,     
  5: EXAMS_TYPE.FIRST,   
  6: EXAMS_TYPE.FIRST,      
  7: EXAMS_TYPE.STARTERS,   
  8: EXAMS_TYPE.MOVERS,     
  9: EXAMS_TYPE.FLYERS,    
  10: EXAMS_TYPE.PRELIM,  
  11: EXAMS_TYPE.PRELIM,   
  12: EXAMS_TYPE.MOVERS,  
  13: EXAMS_TYPE.FLYERS,    
  14: EXAMS_TYPE.PRELIM,   
};


const LEVEL_TO_EXAM_TYPE_BY_AGE = {
  2: {
    kids: EXAMS_TYPE.FLYERS,
    adults: EXAMS_TYPE.KEY
  },

  1: {
    kids: EXAMS_TYPE.MOVERS,
    adults: EXAMS_TYPE.MOVERS
  },
  7: {
    kids: EXAMS_TYPE.STARTERS,
    adults: EXAMS_TYPE.STARTERS
  },
  3: {
    kids: EXAMS_TYPE.PRELIM,
    adults: EXAMS_TYPE.PRELIM
  },
  4: {
    kids: EXAMS_TYPE.PRELIM,
    adults: EXAMS_TYPE.PRELIM
  },
  5: {
    kids: EXAMS_TYPE.FIRST,
    adults: EXAMS_TYPE.FIRST
  },
  6: {
    kids: EXAMS_TYPE.FIRST,
    adults: EXAMS_TYPE.FIRST
  }
};

const ERROR_MESSAGES = {
  STUDENT_NOT_FOUND: 'Student not found',
  STUDENT_HIDDEN_SUCCESS: 'Student hidden from frontend successfully',
  TRANSFER_VALIDATION: 'Please provide either a course or a level to transfer students.',
  TRANSFER_ERROR: 'Error requesting transfer for students',
  PROGRESS_ERROR: 'Error transferring or progressing students'
};

module.exports = {
  DAYS_OF_WEEK,
  AGE_CATEGORY,
  ALLOWED_STATUS,
  USER_TYPES,
  EXAMS_TYPE,
  EXAM_MODULES,
  EXAM_TYPE_MODULES,
  LEVEL_TO_EXAM_TYPE,
  LEVEL_TO_EXAM_TYPE_BY_AGE,
  ERROR_MESSAGES
};
