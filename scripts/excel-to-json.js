const fs = require('fs');
const convertExcel = require('excel-as-json').processFile;

const dir = './data/period 6';

if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
}

['scorers', 'defense']
    .map((name, idx) => ({
        src: `./scripts/period-6.xlsx`,
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