// pages/ConnectedDevice/ConnectedDevice.ts
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

	},

	/**
	 * 组件的方法列表
	 */
	methods: {
      addDev(){
        console.log("点击了添加设备");
        wx.navigateTo({url:'../AddDevice/AddDevice?'})
        
        
      }
	}
})