const sequelize = require("../utils/Database") // Import sequelize instance
const path = require('path') // Import path module
const { QueryTypes } = require("sequelize") // Import QueryTypes from sequelize
const { sendEmail } = require('../controllers/EmailController') // Import sendEmail function from EmailController

const XLSX = require('xlsx') // Import XLSX module
const { log } = require("console")

// Welcome function to handle GET request on "/"
const welcome = (req, res) => {
    res.send("hello")
}

const checkDuplicateVariant = async (variantId, sku) => {
    // Check if variant ID or SKU already exists in the database
    const [existingVariant] = await sequelize.query(`
            SELECT variantid FROM products WHERE variantid = ? OR sku = ?
        `, {
        type: QueryTypes.SELECT,
        replacements: [variantId, sku]
    });

    return existingVariant ? true : false; // Return true if duplicate exists, false otherwise
}

// uploadDoc function to handle POST request on "/upload"
// const uploadDoc = async (req, res) => {
//     try {
//         const document = req.file // Get uploaded file
//         console.log(document)
//         const workbook = XLSX.readFile(path.join(__dirname, '../uploads/' + document.filename)); // Read the uploaded file
//         const sheet_name_list = workbook.SheetNames;
//         const xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]); // Convert sheet to json
//         const length = xlData.length // Get the length of xlData array

//         // Loop through xlData and insert data into products table
//         for (let i = 0; i < xlData.length; i++) {
//             const data = xlData[i];
//             await sequelize.query(`
//             INSERT INTO products (productname, sku, variantid, price, discountpercentage, description, categoryid) VALUES (?, ?, ? ,? ,?, ?,?)
//             `, {
//                 type: QueryTypes.INSERT,
//                 replacements: [data.productname, data.sku, data.variantid, data.price, data.discountpercentage, data.description, data.categoryid]
//             });
//         }

//         // Send email with document and length
//         sendEmail(document, length)
//         res.status(200).json({ status: "success" })

//     } catch (err) {
//         console.log(err)
//     }
// }

const uploadDoc = async (req, res) => {
    try {
        const document = req.file; // Get uploaded file
        const workbook = XLSX.readFile(path.join(__dirname, '../uploads/' + document.filename)); // Read the uploaded file
        const sheet_name_list = workbook.SheetNames;
        const xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]); // Convert sheet to JSON
        const length = xlData.length; // Get the length of xlData array

        const skippedData = []; // Array to store skipped data

        // Loop through xlData
        for (let i = 0; i < xlData.length; i++) {
            const data = xlData[i];
            // Check if SKU and variant ID already exist in the database
            const isDuplicate = await checkDuplicateVariant(data.variantid, data.sku);
            if (isDuplicate) {
                skippedData.push(data); // Store skipped data in skippedData array
                continue; // Skip inserting this data and move to the next iteration
            }

            // Insert data into products table
            await sequelize.query(`
                INSERT INTO products (productname, sku, variantid, price, discountpercentage, description, categoryid) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, {
                type: QueryTypes.INSERT,
                replacements: [data.productname, data.sku, data.variantid, data.price, data.discountpercentage, data.description, data.categoryid]
            });
        }

        // Send email with document and length
        sendEmail(document, length, skippedData);

        // Send response with skipped data
        res.status(200).json({ status: "success", skippedData });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

const exportDoc = async (req, res) => {
    try {
        const rows = await sequelize.query(`SELECT p.productname, p.sku, p.variantid, p.description, c.categoryname, FORMAT((p.price - (p.price * p.discountpercentage/100)),2) as discountedPrice FROM products p JOIN category c ON p.categoryid = c.categoryid`, {
            type: QueryTypes.SELECT,
        });

        // Check if rows is empty
        if (!Array.isArray(rows)) {
            res.status(404).send('No data found');
            return;
        }

        // Convert rows to workbook and set response
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(rows, { header: ['productname', 'sku', 'variantid', 'description', 'categoryname', 'discountedPrice'] });
        XLSX.utils.book_append_sheet(workbook, worksheet, "products");
        const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

        // Set headers and send response
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", "attachment; filename=products.xlsx");
        res.send(buffer);

    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

// Export functions
module.exports = {
    welcome,
    uploadDoc,
    exportDoc
}

// const uploadDoc = async (req, res) => {
//     try {
//         const document = req.file; // Get uploaded file
//         const workbook = XLSX.readFile(path.join(__dirname, '../uploads/' + document.filename)); // Read the uploaded file
//         const sheet_name_list = workbook.SheetNames;
//         const xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]); // Convert sheet to JSON
//         const length = xlData.length; // Get the length of xlData array

//         const skippedData = []; // Array to store skipped data

//         // Loop through xlData
//         for (let i = 0; i < xlData.length; i++) {
//             const data = xlData[i];
//             // Check if SKU and variant ID already exist in the database
//             const isDuplicate = await checkDuplicateVariant(data.variantid, data.sku);
//             if (isDuplicate) {
//                 skippedData.push(data); // Store skipped data in skippedData array
//                 continue; // Skip inserting this data and move to the next iteration
//             }

//             // Insert data into products table
//             await sequelize.query(`
//                 INSERT INTO products (productname, sku, variantid, price, discountpercentage, description, categoryid)
//                 VALUES (?, ?, ?, ?, ?, ?, ?)
//             `, {
//                 type: QueryTypes.INSERT,
//                 replacements: [data.productname, data.sku, data.variantid, data.price, data.discountpercentage, data.description, data.categoryid]
//             });
//         }

//         // Send email with document and length
//         sendEmail(document, length);

//         // Send response with skipped data
//         res.status(200).json({ status: "success", skippedData });

//     } catch (err) {
//         console.log(err);
//         res.status(500).json({ error: "Internal Server Error" });
//     }
// }

// const checkDuplicateVariant = async (variantId, sku) => {
//     // Check if variant ID or SKU already exists in the database
//     const [existingVariant] = await sequelize.query(`
//         SELECT variantid FROM products WHERE variantid = ? OR sku = ?
//     `, {
//         type: QueryTypes.SELECT,
//         replacements: [variantId, sku]
//     });

//     return existingVariant ? true : false; // Return true if duplicate exists, false otherwise
// }