const multer = require('multer');
const path = require('path');

// Define the upload path explicitly
// const uploadPath = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads');
    },
    filename: (req, file, cb) => {
        console.log(file)
        const rename = Date.now() + "-" + file.originalname;
        cb(null, rename);
    }
});

const upload = multer({ storage: storage });
module.exports = upload;