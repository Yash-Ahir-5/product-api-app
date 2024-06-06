const express = require('express');
const router = express();

const {
    welcome,
    uploadDoc,
    exportDoc
} = require('../controllers/UserControllers');


const upload = require('../middleware/Upload');
const { listProducts } = require('../controllers/ListProducts');

router.get("/", welcome);
router.post("/upload", upload.single("doc"),uploadDoc);
router.get("/export", exportDoc);
router.get("/products",listProducts);

module.exports = router