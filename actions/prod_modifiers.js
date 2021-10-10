const axios = require('axios')
const fs = require('fs');
const path = require('path')
require('dotenv').config()

const action = async ($data) => {
    console.log('action data', $data);

    // fs.writeFileSync(path.join(__dirname+'/categories.json'), $data);

    try {
        await axios.post(`${process.env.B24_API_URL}set.prod.modifiers`, {
            data: $data
        });
    } catch (e) {

    }

    // try {
    //     await axios.post(`${process.env.B24_API_URL}categories.info`, {
    //         data: $data
    //     });
    // } catch (e) {
    //
    // }
}

module.exports = action;