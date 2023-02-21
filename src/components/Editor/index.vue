<template>
    <div
        id="editor"
        class="editor"
        :class="{ edit: isEdit }"
        :style="{
            ...getCanvasStyle(canvasStyleData),
            width: changeStyleWithScale(canvasStyleData.width) + 'px',
            height: changeStyleWithScale(canvasStyleData.height) + 'px',
        }"
        @contextmenu="handleContextMenu"
        @mousedown="handleMouseDown"
    >
        <!-- 网格线 -->
        <Grid />

        <!--页面组件列表展示-->
        <!-- <grid-layout :layout.sync="componentData"
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
        </grid-layout> -->
        <!-- <Shape
            v-for="(item, index) in componentData"
            :key="item.id"
            :default-style="item.style"
            :style="getShapeStyle(item.style)"
            :active="item.id === (curComponent || {}).id"
            :element="item"
            :index="index"
            :class="{ lock: item.isLock }"
        >
            <component
                :is="item.component"
                v-if="item.component.startsWith('SVG')"
                :id="'component' + item.id"
                :style="getSVGStyle(item.style)"
                class="component"
                :prop-value="item.propValue"
                :element="item"
                :request="item.request"
            />

            <component
                :is="item.component"
                v-else-if="item.component != 'VText'"
                :id="'component' + item.id"
                class="component"
                :style="getComponentStyle(item.style)"
                :prop-value="item.propValue"
                :element="item"
                :request="item.request"
            />

            <component
                :is="item.component"
                v-else
                :id="'component' + item.id"
                class="component"
                :style="getComponentStyle(item.style)"
                :prop-value="item.propValue"
                :element="item"
                :request="item.request"
                @input="handleInput"
            />
        </Shape> -->
        <!-- 右击菜单 -->
        <ContextMenu />
        <!-- 标线 -->
        <MarkLine />
        <!-- 选中区域 -->
        <Area
            v-show="isShowArea"
            :start="start"
            :width="width"
            :height="height"
        />
    </div>
</template>

<script>
import { mapState } from 'vuex'
import Shape from './Shape'
import { getStyle, getComponentRotatedStyle, getShapeStyle, getSVGStyle, getCanvasStyle } from '@/utils/style'
import { $, isPreventDrop } from '@/utils/utils'
import ContextMenu from './ContextMenu'
import MarkLine from './MarkLine'
import Area from './Area'
import eventBus from '@/utils/eventBus'
import Grid from './Grid'
import { changeStyleWithScale } from '@/utils/translate'

import { GridLayout, GridItem } from "vue-grid-layout"


export default {
    components: { Shape, ContextMenu, MarkLine, Area, Grid,GridLayout, GridItem},
    props: {
        isEdit: {
            type: Boolean,
            default: true,
        },
    },
    data() {
        return {
            draggable: true,
            resizable: true,
            colNum: 12,
            index: 0,

            editorX: 0,
            editorY: 0,
            start: { // 选中区域的起点
                x: 0,
                y: 0,
            },
            width: 0,
            height: 0,
            isShowArea: false,
            svgFilterAttrs: ['width', 'height', 'top', 'left', 'rotate'],
        }
    },
    computed: mapState([
        'componentData',
        'curComponent',
        'canvasStyleData',
        'editor',
    ]),
    mounted() {
        // 获取编辑器元素
        this.$store.commit('getEditor')

        eventBus.$on('hideArea', () => {
            this.hideArea()
        })
    },
    methods: {
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
        
        removeItem(val) {
            const index = this.componentData.map(item => item.i).indexOf(val)
            this.$store.commit('deleteComponent',index)
        },
        getShapeStyle,
        getCanvasStyle,
        changeStyleWithScale,

        handleMouseDown(e) {
            // 如果没有选中组件 在画布上点击时需要调用 e.preventDefault() 防止触发 drop 事件
            if (!this.curComponent || (isPreventDrop(this.curComponent.component))) {
                e.preventDefault()
            }

            this.hideArea()

            // 获取编辑器的位移信息，每次点击时都需要获取一次。主要是为了方便开发时调试用。
            const rectInfo = this.editor.getBoundingClientRect()
            this.editorX = rectInfo.x
            this.editorY = rectInfo.y

            const startX = e.clientX
            const startY = e.clientY
            this.start.x = startX - this.editorX
            this.start.y = startY - this.editorY
            // 展示选中区域
            this.isShowArea = true

            const move = (moveEvent) => {
                this.width = Math.abs(moveEvent.clientX - startX)
                this.height = Math.abs(moveEvent.clientY - startY)
                if (moveEvent.clientX < startX) {
                    this.start.x = moveEvent.clientX - this.editorX
                }

                if (moveEvent.clientY < startY) {
                    this.start.y = moveEvent.clientY - this.editorY
                }
            }

            const up = (e) => {
                document.removeEventListener('mousemove', move)
                document.removeEventListener('mouseup', up)

                if (e.clientX == startX && e.clientY == startY) {
                    this.hideArea()
                    return
                }

                this.createGroup()
            }

            document.addEventListener('mousemove', move)
            document.addEventListener('mouseup', up)
        },

        hideArea() {
            this.isShowArea = 0
            this.width = 0
            this.height = 0

            this.$store.commit('setAreaData', {
                style: {
                    left: 0,
                    top: 0,
                    width: 0,
                    height: 0,
                },
                components: [],
            })
        },

        createGroup() {
            // 获取选中区域的组件数据
            const areaData = this.getSelectArea()
            if (areaData.length <= 1) {
                this.hideArea()
                return
            }

            // 根据选中区域和区域中每个组件的位移信息来创建 Group 组件
            // 要遍历选择区域的每个组件，获取它们的 left top right bottom 信息来进行比较
            let top = Infinity, left = Infinity
            let right = -Infinity, bottom = -Infinity
            areaData.forEach(component => {
                let style = {}
                if (component.component == 'Group') {
                    component.propValue.forEach(item => {
                        const rectInfo = $(`#component${item.id}`).getBoundingClientRect()
                        style.left = rectInfo.left - this.editorX
                        style.top = rectInfo.top - this.editorY
                        style.right = rectInfo.right - this.editorX
                        style.bottom = rectInfo.bottom - this.editorY

                        if (style.left < left) left = style.left
                        if (style.top < top) top = style.top
                        if (style.right > right) right = style.right
                        if (style.bottom > bottom) bottom = style.bottom
                    })
                } else {
                    style = getComponentRotatedStyle(component.style)
                }

                if (style.left < left) left = style.left
                if (style.top < top) top = style.top
                if (style.right > right) right = style.right
                if (style.bottom > bottom) bottom = style.bottom
            })

            this.start.x = left
            this.start.y = top
            this.width = right - left
            this.height = bottom - top

            // 设置选中区域位移大小信息和区域内的组件数据
            this.$store.commit('setAreaData', {
                style: {
                    left,
                    top,
                    width: this.width,
                    height: this.height,
                },
                components: areaData,
            })
        },

        getSelectArea() {
            const result = []
            // 区域起点坐标
            const { x, y } = this.start
            // 计算所有的组件数据，判断是否在选中区域内
            this.componentData.forEach(component => {
                if (component.isLock) return

                const { left, top, width, height } = getComponentRotatedStyle(component.style)
                if (x <= left && y <= top && (left + width <= x + this.width) && (top + height <= y + this.height)) {
                    result.push(component)
                }
            })

            // 返回在选中区域内的所有组件
            return result
        },

        handleContextMenu(e) {
            e.stopPropagation()
            e.preventDefault()

            // 计算菜单相对于编辑器的位移
            let target = e.target
            let top = e.offsetY
            let left = e.offsetX
            while (target instanceof SVGElement) {
                target = target.parentNode
            }

            while (!target.className.includes('editor')) {
                left += target.offsetLeft
                top += target.offsetTop
                target = target.parentNode
            }

            this.$store.commit('showContextMenu', { top, left })
        },

        getComponentStyle(style) {
            return getStyle(style, this.svgFilterAttrs)
        },

        getSVGStyle(style) {
            return getSVGStyle(style, this.svgFilterAttrs)
        },

        handleInput(element, value) {
            // 根据文本组件高度调整 shape 高度
            this.$store.commit('setShapeStyle', { height: this.getTextareaHeight(element, value) })
        },

        getTextareaHeight(element, text) {
            let { lineHeight, fontSize, height } = element.style
            if (lineHeight === '') {
                lineHeight = 1.5
            }

            const newHeight = (text.split('<br>').length - 1) * lineHeight * (fontSize || this.canvasStyleData.fontSize)
            return height > newHeight ? height : newHeight
        },
    },
}
</script>

<style lang="scss" scoped>
.editor {
    position: relative;
    background: #fff;
    margin: auto;

    .lock {
        opacity: .5;

        &:hover {
            cursor: not-allowed;
        }
    }
}

.edit {
    .component {
        outline: none;
        width: 100%;
        height: 100%;
    }
}
</style>
