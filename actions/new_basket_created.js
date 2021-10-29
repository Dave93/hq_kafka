const axios = require('axios')
const fs = require('fs');
const path = require('path')
require('dotenv').config()

const action = async ($data) => {
    console.log('action data', $data);

    try {
        await axios.post(`${process.env.B24_API_URL}new.basket.lead`, {
            data: $data
        });
    } catch (e) {

    }
}

module.exports = action;
