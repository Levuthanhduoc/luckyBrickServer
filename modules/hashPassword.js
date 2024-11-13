const bcrypt = require('bcrypt');
require('dotenv')
const saltRound = 10;
exports.hashPassword = (password)=>{
    try {
        const salt = bcrypt.genSaltSync(saltRound);
        const hash = bcrypt.hashSync(password, salt);
        return hash
    } catch (error) {
        console.error(error)
        return false
    }
}