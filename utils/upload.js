const multer = require('multer');
const path = require('path');
const fileStorage = require('fs');

const UPLOAD_DIR = path.join(__dirname, '../uploads');

const deleteFile = (filePath) => {
  if (!filePath) return false;

  try {
    const fullPath = path.join(UPLOAD_DIR, path.basename(filePath));
    if (fileStorage.existsSync(fullPath)) {
      fileStorage.unlinkSync(fullPath);
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    if (!fileStorage.existsSync(UPLOAD_DIR)) {
      fileStorage.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
    callback(null, UPLOAD_DIR);
  },
  filename: (req, file, callback) => {
    const timestamp = Date.now();
    const randomNum = Math.round(Math.random() * 1e9);
    const uniqueSuffix = `${timestamp}-${randomNum}`;
    callback(
      null,
      `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, callback) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimetype && extname) {
      return callback(null, true);
    }
    callback(new Error('Only images (jpeg, jpg, png) are allowed'));
  },
});

module.exports = { upload, deleteFile };
