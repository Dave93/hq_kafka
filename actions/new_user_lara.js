const axios = require('axios')
const fs = require('fs');
const path = require('path')
require('dotenv').config()

const action = async ($data) => {
    console.log('action data', $data);

    try {
        fs.writeFileSync(path.join(__dirname, 'users/' + $data['id'] + '.json'), JSON.stringify($data));
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
                        "PHONE": {'n0': {"VALUE": $data['phone'], "VALUE_TYPE": "MOBILE"}},
                    }
                },
            params: {"REGISTER_SONET_EVENT": "Y"},
            additionalParams: {
                "project": $data['project'],
                'phone': $data['phone'],
                'id': $data['id']
            }
        });
        console.log(result)
    } catch (e) {

    }
}

module.exports = action;
