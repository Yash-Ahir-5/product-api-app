const { QueryTypes } = require("sequelize");
const sequelize = require("../utils/Database");


const listProducts = async (req, res) => {
    try {
        const products = await sequelize.query(
            `SELECT 
                p.productname, 
                FORMAT((p.price - (p.price * p.discountpercentage/100)),2) as discountedPrice, 
                p.sku, 
                p.variantid, 
                p.description, 
                p.price, 
                CONCAT(FORMAT(p.discountpercentage,0),'%') as discountpercentage,
                c.categoryname as category_name 
            FROM 
                products p JOIN category c ON p.categoryid = c.categoryid`,
            {
                type: QueryTypes.SELECT,
            }
        );
        res.status(200).json(products);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

module.exports = {
    listProducts,
};

