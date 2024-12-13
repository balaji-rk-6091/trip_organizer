const multer = require('multer');
const path = require('path');

// Set storage engine
const storage = multer.diskStorage({
  destination: './Files',
  filename: (req, file, cb) => {
    const familyMember = req.body;
    const fileName = `${familyMember.first_name}_${familyMember.last_name}${path.extname(file.originalname)}`;
    cb(null, fileName);
  }
});

// Initialize upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 }, // 1MB file size limit
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb);
  }
}).single('proof_file'); // Single file upload with field name 'proof_file'

// Check file type
function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|pdf/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Error: Images and PDFs Only!'));
  }
}

module.exports = upload;