// pages/DeviceDetailsPage/DeviceDetailsPage.ts
const app = getApp()
import Dialog from '@vant/weapp/dialog/dialog';
import { BLEMannage } from "../../BLEMannage"
import SystemInfoUtil from "../../tools";
Page({
  /**
   * 页面的初始数据
   */
  data: {
    deviceInfo: {} as any,
    //是否展示修改按键功能picker
    isShowPicker: false,
    nibStrength: -100,
    //改变的value
    nibChangeValue: 0,
    //数据类型 key:0 上键 1下键, func:1 单击 2双击 3长按
    settingType: {} as { key: number, interactive: number },
    pickerTitle: "",
    pickerIndex: 0,
    //当前上按键功能 展示用-设置成功后需要刷新 如果是-1说明没拉取到按键功能
    currentTopKey: { click: -1, doubleClick: -1, longPress: -1 },
    //需要修改的上按键功能 用于上传数据
    toTopKey: { click: -1, doubleClick: -1, longPress: -1 },
    //当前下按键功能 展示用-设置成功后需要刷新
    currentBottomKey: { click: -1, doubleClick: -1, longPress: -1 },
    //需要修改的下按键功能 用于上传数据
    toBottomKey: { click: -1, doubleClick: -1, longPress: -1 },
    bleMannage: {} as BLEMannage,
    isShowNibStrengthChangeView: false,

    funcList: [
      'HOME键',
      '电源键',
      '亮度+',
      '亮度-',
      '任务栏',
      '音量+',
      '音量-',
      '上一页',
      '下一页',
      '静音',
      '搜索',
      '拍照',
      '快速截屏',
      '编辑截屏',
      '撤销',
      '笔/橡皮檫切换',
      '全屏',
      '黑屏',
      '播放/暂停',
      '上一曲',
      '下一曲',
      '快速添加分页（快速创建笔记）',
      ' 添加（移除）尺子',
      '快速创建语言转文字备忘录',
      '无功能',
    ]
  },
  // '快速添加分页（快速创建笔记）',
  // '添加（移除）尺子',
  // '快速创建语言转文字备忘录',
  // '全屏',
  // '黑屏',
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options: any) {
    this.setData({
      deviceInfo: app.pushDetialsDevice
    })
    console.log("this.data.deviceInfo==", this.data.deviceInfo);

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    let self = this;

    console.log("self.properties.deviceInfo==", self.data.deviceInfo);
    this.setData({
      bleMannage: new BLEMannage()
    })
    this.data.bleMannage.bleReceiveValue = function (value) {
      console.log("bleReceiveValue-回调--", value);
      let hexStr = value
      if (hexStr.length < 40) {
        //不是我想要的数据
        return;
      }
      let hexStrList = hexStr.match(/[\da-f]{2}/gi)!
      console.log("hexStrList===", hexStrList);
      if (hexStrList.length != 20) {
        //不是我想要的数据
        return;
      }
      //获取当前连接的设备设置他的电量和充电状态
      //充电状态
      if (hexStr.indexOf("a103") != -1) {
        //电量和充电状态
        console.log("获取到电量", hexStrList);
        let state = hexStrList[4];
        self.data.deviceInfo["battery"] = parseInt(hexStrList[3], 16) + '%';
        self.data.deviceInfo["chargingState"] = Number(state) == 1 ? "充电中" : "未充电"
        self.setData({
          deviceInfo: self.data.deviceInfo
        })
        console.log("获取到电量", self.data.deviceInfo);
      } else if (hexStr.indexOf("a125") != -1) {
        //笔尖强度比
        console.log("获取到笔尖强度比", self.data.deviceInfo);
        let value = hexStrList[3];
        let numValue = parseInt(value, 16)
        numValue = numValue < 10 ? 10 : numValue;
        numValue = numValue > 90 ? 90 : numValue;
        self.setData({
          nibStrength: (50-numValue) / 2,
          nibChangeValue: (50-numValue) / 2,
        })
        // a125100000000000000000000000000000000000
      } else if (hexStr.indexOf("a122") != -1) {
        console.log("获取到按键类型", self.data.deviceInfo);
        //按键类型
        if (hexStrList[3] == '01') {//下

          self.setData({
            currentBottomKey: { click: parseInt(hexStrList[4], 16), doubleClick: parseInt(hexStrList[5], 16), longPress: parseInt(hexStrList[6], 16) },
            toBottomKey: { click: parseInt(hexStrList[4], 16), doubleClick: parseInt(hexStrList[5], 16), longPress: parseInt(hexStrList[6], 16) },
          });
          //当前下按键功能 展示用-设置成功后需要刷新
          // currentBottomKey: { click: -1, doubleClick: -1, longPress: -1 },

        } else if (hexStrList[3] == '00') {//上
   
          self.setData({
            currentTopKey: { click: parseInt(hexStrList[4], 16), doubleClick: parseInt(hexStrList[5], 16), longPress: parseInt(hexStrList[6], 16) },
            toTopKey: { click: parseInt(hexStrList[4], 16), doubleClick: parseInt(hexStrList[5], 16), longPress: parseInt(hexStrList[6], 16) },
          });
        }
      } else if (hexStr.indexOf("a121") != -1) {
        //按键修改成功
        wx.showToast({ title: '修改成功', icon: 'success' })
        self.setData({
          currentBottomKey: self.data.toBottomKey,
          currentTopKey: self.data.toTopKey,
        })

      } else if (hexStr.indexOf('a1a1') != -1) {
        wx.showToast({ title: "修改失败", icon: 'error' })
        self.setData({
          toBottomKey: self.data.currentBottomKey,
          toTopKey: self.data.currentTopKey,
        })
      } else if (hexStr.indexOf('a124') != -1) {
        wx.showToast({ title: '修改成功', icon: 'success' })
        self.setData({
          nibStrength: self.data.nibChangeValue,
        })
      } else if (hexStr.indexOf('a1a4') != -1) {
        self.setData({
          nibChangeValue: self.data.nibStrength
        })
        wx.showToast({ title: "修改失败", icon: 'error' })
      } else if (hexStr.indexOf('a114') != -1) {
        wx.showToast({ title: '恢复出厂设置成功', icon: 'success' })
        self.getPenKeyBoradFunc();
      }

    }
    this.getPenKeyBoradFunc();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },
  //展示功能选择器
  onShowPicker(event: any) {
    let tag: string = event.currentTarget.dataset.tag;
    let subStrs = tag.split('.')
    console.log("subStrs===", subStrs);
    console.log("this.data.currentTopKey==", this.data.currentTopKey);
    console.log(" this.data.currentBottomKey==", this.data.currentBottomKey);


    let index = 0
    if (subStrs[0] == '0') {//上
      if (subStrs[1] == '1') {
        index = this.data.currentTopKey.click
      } else if (subStrs[1] == '2') {
        index = this.data.currentTopKey.doubleClick
      } else if (subStrs[1] == '3') {
        index = this.data.currentTopKey.longPress
      }
    } else {//下
      if (subStrs[1] == '1') {
        index = this.data.currentBottomKey.click
      } else if (subStrs[1] == '2') {
        index = this.data.currentBottomKey.doubleClick
      } else if (subStrs[1] == '3') {
        index = this.data.currentBottomKey.longPress
      }
    }

    //分割字符串
    this.setData({
      settingType: { key: Number(subStrs[0]), interactive: Number(subStrs[1]) },
      isShowPicker: true,
      pickerIndex: index
    })


    this.setPickerTitle();
  },
  onPickerChange(event: any) {
    console.log("onPickerChange===", event);
  },
  onPickerClose() {
    this.setData({
      isShowPicker: false
    })
    // isShowPicker = false;
  },
  setPickerTitle() {
    let key = this.data.settingType.key == 0 ? "上键" : "下键"
    let interactive = ''
    if (this.data.settingType.interactive == 1) {
      interactive = "单按"
    } else if (this.data.settingType.interactive == 2) {
      interactive = "双按"
    } else {
      interactive = "长按"
    }
    this.setData({
      pickerTitle: `设置"${interactive}${key}"`
    })
  },
  //获取按键功能 以及笔尖强度
  getPenKeyBoradFunc() {
    if (!app.currentConDevId.length) {
      //如果设备未连接
      return;
    }
    //电量
    this.data.bleMannage.writeDataToBlLEDevice("A103000000000000000000000000000000000000", app.currentConDevId, app.serveId, app.characteristicId_TX);
    //笔尖强度
    this.data.bleMannage.writeDataToBlLEDevice("A125000000000000000000000000000000000000", app.currentConDevId, app.serveId, app.characteristicId_TX);
    //下键功能获取
    this.data.bleMannage.writeDataToBlLEDevice("A122000100000000000000000000000000000000", app.currentConDevId, app.serveId, app.characteristicId_TX);
    //上键
    this.data.bleMannage.writeDataToBlLEDevice("A122000000000000000000000000000000000000", app.currentConDevId, app.serveId, app.characteristicId_TX);
  },
  //点击cell中的开启或者关闭蓝牙按钮
  onClickSwitchBLEState(event: any) {
    //这里需要考虑断开连接的逻辑
    let self = this;
    let devId = event.currentTarget.dataset.devid;
    let isConnection = event.currentTarget.dataset.connection;
    console.log("this.data.bleMannage===", this.data.bleMannage);

    //如果是已连接状态那么需要断开连接
    if (isConnection) {
      //如果已连接那么久断开
      this.data.bleMannage.closeBLEConnection(devId)
      app.currentConDevId = ""
      self.data.deviceInfo["isConnection"] = false;

      console.log("self.data.deviceInfo=", self.data.deviceInfo);
      self.setData({
        deviceInfo: self.data.deviceInfo
      })
      return;
    }

    self.onConnectingToDevice(devId);

  },
  //连接到设备
  onConnectingToDevice(deviceId: string) {
    let devId = deviceId
    let self = this;
    wx.showLoading({
      title: '正在连接...',
    })
    self.data.bleMannage.onConnectedBle(devId, ((result) => {
      wx.hideLoading()
      if (result) {
        wx.showToast({
          title: '连接成功',
          icon: 'success',
          duration: 1000
        })
        app.currentConDevId = devId;
        self.data.deviceInfo["isConnection"] = true;

        console.log("self.data.deviceInfo=", self.data.deviceInfo);
        self.setData({
          deviceInfo: self.data.deviceInfo
        })
        console.log("连接成功查看数据", self.data.deviceInfo);

        //获取连接设备的服务id和特征id
        /*
          currentConDevId:"",
serveId:"",
characteristicId_RX:"",
characteristicId_TX:"",
        */
        self.data.bleMannage.getDeviceServeIdAndCharacteristicId(devId, ((serveId: string, RX: string, TX: string) => {
          console.log('获取特征ID成功--', `serveId=${serveId}  RX==${RX} TX==${TX}`);
          app.serveId = serveId;
          app.characteristicId_RX = RX;
          app.characteristicId_TX = TX;
          //获取电量前要添加监听
          //这里要获取电量
          self.data.bleMannage.AddNotify(app.currentConDevId, app.serveId, app.characteristicId_RX, ((result) => {
            if (result) {
              //获取电量

              self.getPenKeyBoradFunc();
            }
          }))

        }))

      } else {
        wx.showModal({
          title: '提示',
          content: '连接失败',
          showCancel: false
        })
      }
    }))
  },
  //修改按键功能
  onPickerConfirm(event: any) {
    console.log("pickerIndex==", this.data.pickerIndex);
    console.log("处理前-this.data.toTopKey==", this.data.toTopKey);
    console.log("处理前-this.data.toBottomKey==", this.data.toBottomKey);
    const { picker, value, index } = event.detail;
    console.log("value---", value, "index---", index);
    //更新数据--

    let key = ""
    let click = ""
    //双击
    let doubleClick = ""
    //长按
    let longPress = ""
    let CRC = "";
    let CRCNum = 0
    CRCNum += index
    console.log("(this.data.settingType.interactive==", this.data.settingType.interactive);

    if (this.data.settingType.key == 0) {//上
      key = "00"
      console.log(this.data.toTopKey);
      click = this.data.toTopKey.click.toString(16);
      doubleClick = this.data.toTopKey.doubleClick.toString(16);
      longPress = '00';
      CRCNum += this.data.toTopKey.click
      CRCNum += this.data.toTopKey.doubleClick

      console.log("旧版CRCNum==", CRCNum);
      let topKey = this.data.toTopKey;

      if (this.data.settingType.interactive == 1) {
        console.log("");
        CRCNum -= this.data.toTopKey.click;
        topKey.click = index;
        click = index.toString(16);
      } else if (this.data.settingType.interactive == 2) {
        CRCNum -= this.data.toTopKey.doubleClick
        topKey.doubleClick = index;
        doubleClick = index.toString(16);
      } else {
   

      
      
      }
      this.setData({
        toTopKey: topKey,
      })
    } else {//下
      key = "01"
      let bottomKey = this.data.toBottomKey;
      console.log(this.data.toBottomKey);
      click = this.data.toBottomKey.click.toString(16);
      doubleClick = this.data.toBottomKey.doubleClick.toString(16);
      longPress = this.data.toBottomKey.longPress.toString(16);
      CRCNum += this.data.toBottomKey.click
      CRCNum += this.data.toBottomKey.doubleClick
      CRCNum += this.data.toBottomKey.longPress

      if (this.data.settingType.interactive == 1) {
        CRCNum -= this.data.toBottomKey.click
        click = index.toString(16);


        bottomKey.click = index;
      } else if (this.data.settingType.interactive == 2) {
        CRCNum -= this.data.toBottomKey.doubleClick
        doubleClick = index.toString(16);

        bottomKey.doubleClick = index;
      } else {
        CRCNum -= this.data.toBottomKey.longPress
        longPress = index.toString(16);
        bottomKey.longPress = index;
      }
      this.setData({
        toBottomKey: bottomKey,
      })
    }
    click = this.stringToHexString(click);
    doubleClick = this.stringToHexString(doubleClick);
    longPress = this.stringToHexString(longPress);
    CRC = (CRCNum + Number(key)).toString(16);
    CRC = this.stringToHexString(CRC);
    let codedingStr = `A12110${key}${click}${doubleClick}${longPress}000000000000000000000000${CRC}`
    console.log("codedingStr===", codedingStr);
    this.data.bleMannage.writeDataToBlLEDevice(codedingStr, app.currentConDevId, app.serveId, app.characteristicId_TX);

    //配置数据
    this.setData({
      isShowPicker: false
    })

  },
  stringToHexString(str: string) {
    let newStr = str.toUpperCase()
    newStr = newStr.length == 1 ? `0${newStr}` : newStr;
    console.log("newStr==", newStr);

    return newStr;
  },
  onPickerCancel() {
    this.setData({
      isShowPicker: false
    })
  },
  onClickNibStrength() {
    this.setData({
      isShowNibStrengthChangeView: true
    })
  },
  //修改笔尖强度
  onChangeNibStrength(event: any) {
    console.log("event.detail", event.detail);
    this.setData({
      nibChangeValue: event.detail.value
    })
  },
  //隐藏修改笔尖强度view
  onHideNibStrengthView() {
    console.log("隐藏啦");

    this.setData({
      isShowNibStrengthChangeView: false,
      nibChangeValue: this.data.nibStrength == -1 ? 0 : this.data.nibStrength
    })
  },
  onConfirmChangeNibStrengthView() {

    let value = this.data.nibChangeValue;
    console.log("修改前--", value);
    value = 50 - value * 2
    console.log("修改后--", value);
    value.toString(16);
    let hexValue = this.stringToHexString(value.toString(16));
    let CRC = 0;

    let codedingStr = `A12410${hexValue}000000000000000000000000000000${hexValue}`
    console.log("codedingStr===", codedingStr);
    this.data.bleMannage.writeDataToBlLEDevice(codedingStr, app.currentConDevId, app.serveId, app.characteristicId_TX);
    this.setData({
      isShowNibStrengthChangeView: false,
    })
  },
  onClickAdd() {

    this.setData({
      nibChangeValue: this.data.nibChangeValue + 1
    })
  },
  onClickReduce() {
    this.setData({
      nibChangeValue: this.data.nibChangeValue - 1
    })
  },
  //恢复出厂设置
  onFactoryDataReset() {
    let codedingStr = `A114100200000000000000000000000000000002`
    console.log("codedingStr===", codedingStr);
    let self = this;
    Dialog.confirm({
      title: '警告!',
      message: '恢复出厂设置后需要重新连接设备,确认要恢复出厂设置?',
    })
      .then(() => {
        this.data.bleMannage.writeDataToBlLEDevice(codedingStr, app.currentConDevId, app.serveId, app.characteristicId_TX);
        self.data.bleMannage.deleteStorageDevice(app.currentConDevId, ((result)=>{
          if(result){
            app.currentConDevId = '';
            app.serveId = '';
            app.characteristicId_TX = '';
            app.characteristicId_RX = '';
            wx.navigateBack();
          }
        }))
        // on confirm
      })
      .catch(() => {
        // on cancel
      });

  },
  onDeleteDevice(){
    let self = this;
    Dialog.confirm({
      title: '警告!',
      message: '确定要删除设备吗?',
    })
      .then(() => {
        //如果设备在连接状态,那么先断开连接
        self.data.bleMannage.closeBLEConnection(app.currentConDevId)
        self.data.bleMannage.deleteStorageDevice(app.currentConDevId, ((result)=>{
          if(result){
            app.currentConDevId = '';
            app.serveId = '';
            app.characteristicId_TX = '';
            app.characteristicId_RX = '';
            wx.navigateBack();
          }
        }))
        // on confirm
      })
      .catch(() => {
        // on cancel
      });
  }




})


/*
能索引 功能描述

12 快速截屏
13 编辑截屏
14 撤销
15 笔/橡皮檫切换
16 全屏
17 黑屏
18 播放/暂停
19 上一曲
20 下一曲
21 快速添加分页（快速创建笔记）
22 添加（移除）尺子
23 快速创建语言转文字备忘录
24 无功能
*/