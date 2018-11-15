//index.js
//获取应用实例
const app = getApp()

let utils = require('../../utils/util.js')

Page({
  data: {
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    scanLabel: '扫码登录/绑定',
  },

  onLoad: function() {
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse) {
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }

    //功能无效
    if (app.globalData.openid) {
      wx.request({
        url: app.globalData.siteUrl + '/?xcx_login-bind-check.htm',
        method: "POST",
        data: {
          openid: app.globalData.openid
        },
        header: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        success: (res) => {
          console.log(res)
          if (res.data.code == 1) {
            this.data.scanLabel = '扫码登录'
          } else if (res.data.code == 2) {
            this.data.scanLabel = '扫码绑定'
          }
        }
      })
    }
  },
  getUserInfo: (e) => {
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },

  scanClick: () => {
    if (app.globalData.openid == '') {
      // 登录
      wx.login({
        success: res => {
          // 发送 res.code 到后台换取 openId, sessionKey, unionId

          wx.request({
            url: app.globalData.siteUrl + app.globalData.openidUrl,
            method: "POST",
            data: {
              code: res.code,
            },
            header: {
              "Content-Type": "application/x-www-form-urlencoded"
            },
            success: res => {
              if (res.statusCode == 200 && res.data.openid) {
                app.globalData.openid = res.data.openid
              }
            }
          })
        }
      })
    }

    if (app.globalData.openid == '') {
      wx.showToast({
        title: 'openid无效',
        icon: 'error',
        duration: 2000
      })
      return
    }
    wx.scanCode({
      onlyFromCamera: true,
      success(res) {
        console.log(utils.Base64.decode(res.result))
        let str = utils.Base64.decode(res.result)
        let obj = JSON.parse(str)
        let openid = app.globalData.openid

        if (obj.type == 'bind' || obj.type == 'login') {
          let [url,title] = ['', ''];
          if (obj.type == 'bind') {
            url = '/?xcx_login-bind-scan_qrcode.htm'
            title = '绑定失败'
          } else {
            url = '/?xcx_login-scan-scan_qrcode.htm'
            title = '登录失败'
          }
          wx.request({
            url: app.globalData.siteUrl + url,
            method: "POST",
            data: {
              qrcode: obj.qrcode,
              openid: openid
            },
            header: {
              "Content-Type": "application/x-www-form-urlencoded"
            },
            success: function(res) {
              console.log(res);
              wx.navigateBack({
                delta: 1 //小程序关闭当前页面返回上一页面
              })

              let icon = 'cancel'
              console.log(res.data.message)
              if (res.data.code == 0) {
                icon = 'success'
                title = (obj.type == 'bind') ? '绑定成功' : '登录成功'
              } else {
                title = res.data.message.errmsg
              }
              wx.showToast({
                title: title,
                icon: icon,
                duration: 2000
              })
            },
          })
        }
      }
    })
  }
})