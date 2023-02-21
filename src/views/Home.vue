<template>
    <div class="home">
        <Toolbar />

        <main>
            <!-- 左侧组件列表 -->
            <section class="left">
                <ComponentList />
                <RealTimeComponentList />
            </section>
            <!-- 中间画布 -->
            <section class="center">
                <div
                    class="content"
                    @drop="handleDrop"
                    @dragover="handleDragOver"
                    @mousedown="handleMouseDown"
                    @mouseup="deselectCurComponent"
                >
                    <!-- <Editor /> -->
                    <grid-layout :layout.sync="componentData"
                        :col-num="12"
                        :row-height="30"
                        :is-draggable="draggable"
                        :is-resizable="resizable"
                        :vertical-compact="true"
                        :use-css-transforms="true"
                    >
                        <grid-item v-for="item in componentData"
                                :static="item.static"
                                :x="item.x"
                                :y="item.y"
                                :w="item.w"
                                :h="item.h"
                                :i="item.i"
                                :key="item.i"
                        >
                            <div class="text">id:{{ item.i }}</div>
                            <div class="text">type: {{ item.component }}</div>
                            <span class="remove" @click="removeItem(item.i)">X</span>
                        </grid-item>
                    </grid-layout>

                </div>
            </section>
            <!-- 右侧属性列表 -->
            <section class="right">
                <el-tabs v-if="curComponent" v-model="activeName">
                    <el-tab-pane label="属性" name="attr">
                        <component :is="curComponent.component + 'Attr'" />
                    </el-tab-pane>
                </el-tabs>
                <CanvasAttr v-else></CanvasAttr>
            </section>
        </main>
    </div>
</template>

<script>
import Editor from '@/components/Editor/index'
import ComponentList from '@/components/ComponentList' // 左侧列表组件
import componentList from '@/custom-component/component-list' // 左侧列表数据
import Toolbar from '@/components/Toolbar'
import { deepCopy } from '@/utils/utils'
import { mapState } from 'vuex'
import generateID from '@/utils/generateID'
import { listenGlobalKeyDown } from '@/utils/shortcutKey'
import RealTimeComponentList from '@/components/RealTimeComponentList'
import CanvasAttr from '@/components/CanvasAttr'
import { changeComponentSizeWithScale } from '@/utils/changeComponentsSizeWithScale'
import { setDefaultcomponentData } from '@/store/snapshot'


import { GridLayout, GridItem } from "vue-grid-layout"

export default {
    components: { Editor, ComponentList, Toolbar, RealTimeComponentList, CanvasAttr,
        GridLayout,
        GridItem 
    },
    data() {
        return {
            activeName: 'attr',
            reSelectAnimateIndex: undefined,

            layout: [
                { x: 0, y: 0, w: 1, h: 2, i: "0" },
            ],
            draggable: true,
            resizable: true,
            colNum: 12,
            index: 0,
        }
    },
    computed: mapState([
        'componentData',
        'curComponent',
        'isClickComponent',
        'canvasStyleData',
        'editor',
    ]),
    created() {
        this.restore()
        // 全局监听按键事件
        listenGlobalKeyDown()
    },
    methods: {
        removeItem(val) {
            const index = this.componentData.map(item => item.i).indexOf(val)
            this.$store.commit('deleteComponent',index)
        },
        itemTitle(item) {
            let result = item.i;
            if (item.static) {
                result += " - Static";
            }
            return result;
        },
        restore() {
            // 用保存的数据恢复画布
            if (localStorage.getItem('canvasData')) {
                setDefaultcomponentData(JSON.parse(localStorage.getItem('canvasData')))
                this.$store.commit('setComponentData', JSON.parse(localStorage.getItem('canvasData')))
            }

            if (localStorage.getItem('canvasStyle')) {
                this.$store.commit('setCanvasStyle', JSON.parse(localStorage.getItem('canvasStyle')))
            }
        },

        handleDrop(e) {
            console.log(e)
            e.preventDefault()
            e.stopPropagation()

            const index = e.dataTransfer.getData('index')
            // const rectInfo = this.editor.getBoundingClientRect()
            if (index) {
                const component = deepCopy(componentList[index])
                // component.style.top = e.clientY - rectInfo.y
                // component.style.left = e.clientX - rectInfo.x

                component.x = 0;
                component.y = this.componentData.length * 2; // puts it at the bottom
                component.i = generateID();

                component.id = generateID()

                console.log(component)

                // 根据画面比例修改组件样式比例 https://github.com/woai3c/visual-drag-demo/issues/91
                changeComponentSizeWithScale(component)

                this.$store.commit('addComponent', { component })
                this.$store.commit('recordSnapshot')
            }
        },

        handleDragOver(e) {
            e.preventDefault()
            e.dataTransfer.dropEffect = 'copy'
        },

        handleMouseDown(e) {
            e.stopPropagation()
            this.$store.commit('setClickComponentStatus', false)
            this.$store.commit('setInEditorStatus', true)
        },

        deselectCurComponent(e) {
            if (!this.isClickComponent) {
                this.$store.commit('setCurComponent', { component: null, index: null })
            }

            // 0 左击 1 滚轮 2 右击
            if (e.button != 2) {
                this.$store.commit('hideContextMenu')
            }
        },
    },
}
</script>

<style lang="scss">
.home {
    height: 100vh;
    background: #fff;

    main {
        height: calc(100% - 64px);
        position: relative;

        .left {
            position: absolute;
            height: 100%;
            width: 200px;
            left: 0;
            top: 0;

            & > div {
                overflow: auto;

                &:first-child {
                    border-bottom: 1px solid #ddd;
                }
            }
        }

        .right {
            position: absolute;
            height: 100%;
            width: 288px;
            right: 0;
            top: 0;

            .el-select {
                width: 100%;
            }
        }

        .center {
            margin-left: 200px;
            margin-right: 288px;
            background: #f5f5f5;
            height: 100%;
            overflow: auto;
            padding: 20px;

            .content {
                width: 100%;
                height: 100%;
                overflow: auto;
            }
        }
    }

    .placeholder {
        text-align: center;
        color: #333;
    }

    .global-attr {
        padding: 10px;
    }
}

.vue-grid-layout {
    background: #eee;
}

.vue-grid-item:not(.vue-grid-placeholder) {
    background: #ccc;
    border: 1px solid black;
}

.vue-grid-item .resizing {
    opacity: .9;
}

.vue-grid-item .static {
    background: #cce;
}

.vue-grid-item .text {
    font-size: 24px;
    text-align: center;

    //     position: absolute;
    //     top: 0;
    //     bottom: 0;
    //     left: 0;
    //     right: 0;
    //     margin: auto;
    //     height: 100%;
    //     width: 100%;
}

.vue-grid-item .no-drag {
    height: 100%;
    width: 100%;
}

.vue-grid-item .minMax {
    font-size: 12px;
}

.vue-grid-item .add {
    cursor: pointer;
}

.vue-draggable-handle {
    position: absolute;
    width: 20px;
    height: 20px;
    top: 0;
    left: 0;
    background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10'><circle cx='5' cy='5' r='5' fill='#999999'/></svg>") no-repeat;
    background-position: bottom right;
    padding: 0 8px 8px 0;
    background-repeat: no-repeat;
    background-origin: content-box;
    box-sizing: border-box;
    cursor: pointer;
}

.remove {
    position: absolute;
    right: 0;
    top: 0;
    padding: 5px;
    cursor: pointer;
}
</style>
