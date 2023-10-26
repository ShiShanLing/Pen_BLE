// pages/DeviceDetails.ts
import Toast from '@vant/weapp/toast/toast';
import { Light } from 'XrFrame/components';
Component({

	/**
	 * 组件的属性列表
	 */
	properties: {

	},

	/**
	 * 组件的初始数据
	 */
	data: {
			columns: ['杭州', '宁波', '温州', '嘉兴', '湖州'],
			isShowPicker:false,
			//数据类型 key:1 上键 2下键, func:1 单击 2双击 3长按
			settingType:{} as {key:number, interactive:number},
			pickerTitle:"",
			//当前上按键功能 展示用-设置成功后需要刷新 如果是-1说明没拉取到按键功能
			currentTopKey:{click:-1, doubleClick:-1, longPress:-1},
			//需要修改的上按键功能 用于上传数据
			toTopKey:{click:-1, doubleClick:-1, longPress:-1},
			//当前下按键功能 展示用-设置成功后需要刷新
			currentBottomKey:{click:-1, doubleClick:-1, longPress:-1},
			//需要修改的下按键功能 用于上传数据
			toBottomKey:{click:-1, doubleClick:-1, longPress:-1}
	},

	/**
	 * 组件的方法列表
	 */
	methods: {
		//展示功能选择器
		onShowPicker(event:any){
			
			let tag:string = event.currentTarget.dataset.tag;
			let subStrs = tag.split('.')
			console.log("subStrs===", subStrs);
			//分割字符串
			this.setData({
				settingType:{key:Number(subStrs[0]), func:Number(subStrs[1])},
				isShowPicker:true
			})
			this.setPickerTitle();
		},
		onPickerChange(event:any){
			console.log("onPickerChange===", event);
		},
		onPickerClose(){
			this.setData({
				isShowPicker:false
			})
			// isShowPicker = false;
		},
		setPickerTitle(){
			let key = this.data.settingType.key == 1?"上键":"下键"
			let interactive = ''
			if (this.data.settingType.interactive == 1){
				interactive = "单按"
			}else if (this.data.settingType.interactive == 2){
				interactive = "双按"
			}else {
				interactive = "长按"
			} 
			this.setData({
				pickerTitle:`设置 "${key}" 的 "${interactive}" 功能`
			})
		},
		//获取按键功能 以及鼻尖强度
		getPenKeyBoradFunc(){
			// A12110010B05010000000000000000000000000A
		},
		//获取按键写入的view
		getBLEWriteValue(funcNum:number){
			//01 02
			//三个按钮都要传,穿之前需要先获取三个按钮的功能
			let key = this.data.settingType.key;
			let interactive = this.data.settingType.interactive;
			let click = "";
			let doubleClick = "";
			let longPress = "";
			let CRC = "";
			let writeValueStr = `A12110${key}${click}${doubleClick}${longPress}000000000000000000000000${CRC}`

		}
	}
})

function hexStringToArrayBuffer(hex_str:string) {
  let typedArray = new Uint8Array(hex_str.match(/[\da-f]{2}/gi)!.map(function (h) {
    return parseInt(h, 16)
  }))
  let buffer = typedArray.buffer
  return buffer
}



					/*
				可以成功的数据:
				A12110010B05010000000000000000000000000A
				这里的12 是 暂停/播放 但是为什么检验位是 17
				A121100103120100000000000000000000000017
				*/

				//A1211001030C0100000000000000000000000017

				let dqdl = "A1211001030C0100000000000000000000000011"