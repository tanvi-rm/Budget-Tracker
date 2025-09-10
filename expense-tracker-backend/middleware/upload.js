const multer = require('multer');

const storage = multer.memoryStorage(); // store file as Buffer
const upload = multer({ storage });

module.exports = upload;
