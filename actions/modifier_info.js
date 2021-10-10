const axios = require('axios')
require('dotenv').config()

const action = async ($data) => {
    console.log('action data', $data);


    try {
        await axios.post(`${process.env.B24_API_URL}modifier.info`, {
            data: $data
        });
    } catch (e) {

    }
}

module.exports = action;