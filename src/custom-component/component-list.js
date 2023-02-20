// 公共样式
export const commonStyle = {
    rotate: 0,
    opacity: 1,
}

export const commonAttr = {
    animations: [],
    events: {},
    groupStyle: {}, // 当一个组件成为 Group 的子组件时使用
    isLock: false, // 是否锁定组件
    collapseName: 'style', // 编辑组件时记录当前使用的是哪个折叠面板，再次回来时恢复上次打开的折叠面板，优化用户体验
    linkage: {
        duration: 0, // 过渡持续时间
        data: [ // 组件联动
            {
                id: '', // 联动的组件 id
                label: '', // 联动的组件名称
                event: '', // 监听事件
                style: [{ key: '', value: '' }], // 监听的事件触发时，需要改变的属性
            },
        ],
    },
}
const defaultData = {"w":1,"h":2, static: false};

// 编辑器左侧组件列表
const list = [
    {
        ...defaultData,
        component: 'VText',
        label: '文字',
        // propValue: '双击编辑文字',
        icon: 'wenben',
        // request: {
        //     method: 'GET',
        //     data: [],
        //     url: '',
        //     series: false, // 是否定时发送请求
        //     time: 1000, // 定时更新时间
        //     paramType: '', // string object array
        //     requestCount: 0, // 请求次数限制，0 为无限
        // },
        // style: {
        //     // width: 200,
        //     height: 28,
        //     fontSize: '',
        //     fontWeight: 400,
        //     lineHeight: '',
        //     letterSpacing: 0,
        //     textAlign: '',
        //     color: '',
        // },
    },
    {
        ...defaultData,
        component: 'VTable',
        label: '表格',
        icon: 'biaoge',
        propValue: {
            data: [
                ['表头1', '表头2', '表头3'],
                ['内容1', '内容2', '内容3'],
            ],
            stripe: true,
            thBold: true,
        },
        request: {
            method: 'GET',
            data: [],
            url: '',
            series: false,
            time: 1000,
            paramType: '', // string object array
            requestCount: 0, // 请求次数限制，0 为无限
        },
        style: {
            width: 780,
            height: 200,
            fontSize: '',
            fontWeight: 400,
            textAlign: 'center',
            color: '',
            backgroundColor: 'rgba(255, 255, 255, 1)',
        },
    },
    {
        ...defaultData,
        component: 'VChart',
        label: '图表',
        icon: 'el-icon-data-analysis',
        propValue: {
            chart: 'VChart',
            option: {
                title: {
                    text: '柱状图',
                    show: true,
                },
                legend: {
                    show: true,
                },
                tooltip: {
                    show: true,
                    trigger: 'item',
                },
                xAxis: {
                    show: true,
                    data: ['A', 'B', 'C', 'D', 'E'],
                },
                yAxis: {},
                series: {
                    type: 'bar',
                    name: '销量',
                    data: [23, 61, 35, 77, 35],
                    itemStyle: {
                        barBorderRadius: 5,
                        borderWidth: 1,
                        borderType: 'solid',
                        borderColor: '#73c0de',
                        shadowColor: '#5470c6',
                        shadowBlur: 3,
                    },
                },
            },
        },
        style: {
            width: 780,
            height: 500,
            borderRadius: '',
        },
    },
]

for (let i = 0, len = list.length; i < len; i++) {
    const item = list[i]
    item.style = { ...commonStyle, ...item.style }
    list[i] = { ...commonAttr, ...item }
}

export default list
