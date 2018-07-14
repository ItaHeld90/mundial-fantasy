const fs = require('fs');
const convertExcel = require('excel-as-json').processFile;
const { period } = require('../settings');

const dir = `./data/period ${period}`;

if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
}

['scorers', 'defense']
    .map((name, idx) => ({
        src: `./scripts/period-${period}.xlsx`,
        dst: `${dir}/${name}.json`,
        sheet: idx + 1
    }))
    .forEach(({ src, dst, sheet }) => {
        convertExcel(
            src,
            dst,
            { 
                sheet,
                isColOriented: false,
                omitEmtpyFields: true
            },
            err => {
                if (err) {
                    console.log('error:', err);
                }
                else {
                    console.log('success');
                }
            }
        )
    });