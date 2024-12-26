import { Gauge } from 'prom-client';
import { SmartSheet } from "wecom-wedoc";
import * as pro from "process";
const { WEDOC_SECRET } = pro.env;

console.info(`Loaded metrics module: 资产一张表指标`);

const XJQD_NO_USE_DEPART_SYS = new Gauge({ name: 'XJQD_NO_USE_DEPART_SYS', help: '资产一张表-巡检清单-无使用单位的信息系统' });
const XJQD_NO_SERVER = new Gauge({ name: 'XJQD_NO_SERVER', help: '资产一张表-巡检清单-无对应服务器的信息系统' });

/**
 * IT资产一张表-信息系统
 */
const GetSheet_信息系统 = {
    docid: "dcj01IUKbAQeYmCCLDiuuF5p_XDJ73pHJJytLTIjVToAk-ojvXNIzP1bKhA0XPpc1Cg7RYGeFKRCn964-y9hEW7g",
    sheet_id: 't8yuup'
}

/**
 * 获取企微token所需参数
 */
const options = {
    secret: WEDOC_SECRET,
    corpId: 'wx75bf77356dbce5f7',
};
export default async function process(registry) {
    const FIELD_USE_DEPART = '所属单位';
    const FIELD_SERVER = '服务器';
    const FIELD_DNS_RDATA = 'DNS解析地址';
    const FIELD_USE_STATUS = '使用情况';
    // 查询智能表格记录数
    let res = await SmartSheet.Record.records(GetSheet_信息系统, options);
    // 获取无使用单位的信息系统的记录
    let XJQD_NO_USE_DEPART_SYS_RECORD = res.filter(record => record.values[FIELD_USE_DEPART].length == 0)
    // 获取无对应服务器的信息系统的记录，无服务器，有DNS解析地址，使用情况为正在使用
    let XJQD_NO_SERVER_RECORD = res.filter((record) => {
        return !record.values[FIELD_SERVER] && record.values[FIELD_DNS_RDATA] &&
            record.values[FIELD_DNS_RDATA][0].text != '未解析' &&
            record.values[FIELD_USE_STATUS] &&
            record.values[FIELD_USE_STATUS].length > 0 &&
            record.values[FIELD_USE_STATUS][0].text == '正在使用'
    })
    XJQD_NO_SERVER_RECORD.forEach(item => {
        console.log(item.values[FIELD_DNS_RDATA][0].text)
    })
    registry.registerMetric(XJQD_NO_USE_DEPART_SYS);
    registry.registerMetric(XJQD_NO_SERVER);
    console.info(`set metrics XJQD_NO_USE_DEPART_SYS: ${XJQD_NO_USE_DEPART_SYS_RECORD.length}, XJQD_NO_SERVER: ${XJQD_NO_SERVER_RECORD.length}`)
    XJQD_NO_USE_DEPART_SYS.set(XJQD_NO_USE_DEPART_SYS_RECORD.length);
    XJQD_NO_SERVER.set(XJQD_NO_SERVER_RECORD.length);
}
