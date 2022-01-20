const axios = require("axios");
const cheerio = require("cheerio");
const babelParser = require("@babel/parser");
var babel = require("@babel/core");
let acorn = require("acorn");

var fs = require("fs-extra");
let ids = [
    "7054572468400291853",
    "7044826282302898184",
    // "7043440914244567054",
    // "7038908706024620045",
    // "7038459812601921550",
    // "7037478950733348901",
    // "7037473968734863391",
    // "7036354289215733791",
    // "7035543139179823118",
    // "7035216237357432840",
    // "7034857481876537380",
    // "7034526305743798285",
    // "7034007302621364261",
    // "7033640446907645983",
    // "7033306469378293791",
    // "7032940757937815583",
    // "7032663396160012295",
    // "7032289105358618632",
    // "7031719940348624933",
    // "7031508533820686350",
    // "7031189517776191518",
    // "7030786939619901470",
    // "7030454568731443208",
    // "7030003426209726472",
    // "7029578488881348621",
    // "7029328849338892319",
    // "7028842630758793246",
    // "7028468626818760711",
    // "7028165657954910222",
    // "7027807945903570957",
    // "7027372909135921183",
    // "7026928507930279966",
    // "7026630608486924295",
    // "7026207350239264781",
    // "7025925719330914340",
    // "7025503828157939719",
    // "7018852084803960868",
    // "7018765637870698503",
    // "7016889543823458334",
    // "7016656649695789064",
    // "7009115194374750222",
    // "6998043554366881805",
    // "6997590944346275876",
    // "6996971685517721608",
    // "6996918972251635749",
    // "6990271352460541982",
    // "6966609674023993351",
    // "6961324555319115807",
    // "6959873199005761549",
    // "6952422478132019237",
    // "6916052183729307655",
    // "6844904049305714702",
    // "6844903971664953357",
    // "6844904035665838087",
    // "6844904035665838094",
    // "6844904035661643790",
    // "6844904035661643784",
    // "6844903971664953351",
    // "6844904035657449480",
    // "6844904035657449485",
    // "6844904035653255182",
    // "6844904035649224717",
    // "6844903934109155336",
];
function syncBlob(index) {
    if(index>=ids.length){
        console.log('全部完成')
        return;
    }
    let id = ids[index];
    let url = "https://juejin.cn/post/" + id;
    
    axios.get(url).then((res) => {
        const $ = cheerio.load(res.data);
        let str = $("body script")[0].children[0].data;
        // fs.writeFile('./t.js',str)
        try {
            let ast = acorn.parse(str, { ecmaVersion: 2020 });
            if (ast) {
                let ps =
                    ast.body[0].expression.right.callee.body.body[0].argument.properties;
                let state = ps.find((item) => item.key.name == "state");
                let view = state.value.properties.find(item => item.key.name == 'view')
                let column = view.value.properties.find(item => item.key.name == 'column')
                let entry = column.value.properties.find(item => item.key.name == 'entry')
                let article_info = entry.value.properties.find(item => item.key.name == 'article_info')
                let mark_content = article_info.value.properties.find(item => item.key.name == 'mark_content')
                let title = article_info.value.properties.find(item => item.key.name == 'title');
                let t = title.value.value + '.md';
                // console.log(t)
                fs.writeFile('./blogs/' + t, mark_content.value.value, (err, data) => {
                    if (!err) {
                        console.log(`${t}：done`)
                        syncBlob(index+1)
                    } else {
                        console.log(err)
                    }
                })
            } else {
                console.log("parse error");
            }
        } catch (error) {
            console.log(error);
        }
    });
    
}
syncBlob(0)