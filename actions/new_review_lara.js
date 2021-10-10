const axios = require('axios')
const fs = require('fs');
const path = require('path')
require('dotenv').config()

const action = async ($data) => {
    console.log('action data', $data);

    try {
        const result = await axios.post(`${process.env.B24_API_URL}new.review.lara`, {
            data: $data
        });
        console.log(result)
    } catch (e) {

    }
}

module.exports = action;
