const axios = require('axios')
const fs = require('fs');
const path = require('path')
require('dotenv').config()

const action = async ($data) => {
    console.log('action data', $data);

    try {
        const result = await axios.post(`${process.env.B24_API_URL}new.order.lara`, {
            data: $data
        });
        // console.log(result);
    } catch (e) {
        console.log(e);
    }
}

module.exports = action;
