const axios = require('axios')
const fs = require('fs');
const path = require('path')
require('dotenv').config()

const action = async ($data) => {
    console.log('action data', $data);

    try {
        const result = await axios.post(`${process.env.B24_API_URL}new.user.lara`, {
            fields:
                {
                    "NAME": $data.name,
                    // "SECOND_NAME": "Егорович",
                    // "LAST_NAME": "Титов",
                    "OPENED": "Y",
                    "ASSIGNED_BY_ID": 1,
                    "TYPE_ID": "CLIENT",
                    "SOURCE_ID": "SELF",
                    "FM": {
                        "PHONE": { 'n0':  { "VALUE": $data['phone'], "VALUE_TYPE": "MOBILE" } },
                    },
                    "UF_CRM_1629654680103": $data['id']
                },
            params: { "REGISTER_SONET_EVENT": "Y" }
        });
        console.log(result)
    } catch (e) {

    }
}

module.exports = action;
