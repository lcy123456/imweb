window.onload = () => {
    window.electronAPI?.ipcInvoke("getWindowPort");
}

const avatar = {
  ic_avatar_01: "./images/avatar/ic_avatar_01.png",
  ic_avatar_02: "./images/avatar/ic_avatar_02.png",
  ic_avatar_03: "./images/avatar/ic_avatar_03.png",
  ic_avatar_04: "./images/avatar/ic_avatar_04.png",
  ic_avatar_05: "./images/avatar/ic_avatar_05.png",
  ic_avatar_06: "./images/avatar/ic_avatar_06.png",
  ic_avatar_07: "./images/avatar/ic_avatar_07.png",
  ic_avatar_08: "./images/avatar/ic_avatar_08.png",
  ic_avatar_09: "./images/avatar/ic_avatar_09.png",
  ic_avatar_10: "./images/avatar/ic_avatar_10.png",
  ic_avatar_11: "./images/avatar/ic_avatar_11.png",
  ic_avatar_12: "./images/avatar/ic_avatar_12.png",
  ic_avatar_13: "./images/avatar/ic_avatar_13.png",
  ic_avatar_14: "./images/avatar/ic_avatar_14.png",
  ic_avatar_15: "./images/avatar/ic_avatar_15.png",
  ic_avatar_16: "./images/avatar/ic_avatar_16.png",
  ic_avatar_17: "./images/avatar/ic_avatar_17.png",
  ic_avatar_18: "./images/avatar/ic_avatar_18.png",
  ic_avatar_19: "./images/avatar/ic_avatar_19.png",
  ic_avatar_20: "./images/avatar/ic_avatar_20.png",
};

const { createApp, ref, toRefs, computed, TransitionGroup, watch } = Vue;

let closeTimer;

const NotificationItem = {
  template: `<div class="notification-item" @click="handleClick">
    <div class="left-wrap">
      <img v-if="avatarUrl" :src="avatarUrl" />
      <div v-else class="name-logo">{{title?.slice(-2)}}</div>
    </div>
    <div class="center-wrap">
      <div class="send-name">{{title}}</div>
      <div class="send-text">{{body}}</div>
    </div>
    <div class="right-wrap" @click="handleReply">回复</div>
    <img class="close-icon" src="./images/close.png" @click.stop="$emit('close')" />
  </div>`,
  props: {
    title: String,
    tag: String,
    body: String,
    faceURL: String,
    isGroup: Boolean,
  },
  emits: ["close"],
  inheritAttrs: false,
  setup (props, { emit }) {

    const handleClick = () => {
      window.electronAPI.ipcInvoke("showWindow")
    }

    const handleReply = () => {
      window.notificationPort.postMessage({
        type: "reply",
        data: props.tag
      })
    }

    const avatarUrl = computed(() => {
      if (props.isGroup) {
        return props.faceURL || './images/group.png';
      }
      return avatar[props.faceURL] || props.faceURL || ""
    })

    const autoClose = () => {
      clearTimeout(closeTimer);
      closeTimer = setTimeout(() => {
        emit('close')
      }, 2 * 60 * 1000);
    }
    watch(() => props.body, autoClose, {
      immediate: true
    });

    return {
      ...toRefs(props),
      avatarUrl,
      handleClick,
      handleReply
    }
  }
}

const maxLen = 4
const App = {
  template: `<div class="container">
    <div class="head-wrap" v-if="showCloseAll" @click="handleCloseAll">全部隐藏</div>
    <TransitionGroup  name="notification-wrap" class="notification-wrap" @before-enter="setNotification" @after-leave="setNotification">
      <NotificationItem v-for="v in notificationArr" :key="v.tag" v-bind="v" @close="handleClose(v.tag)" />
    </TransitionGroup>
  </div>`,
  components: {
    NotificationItem
  },
  setup() {
    const notificationArr = ref([])
    const showCloseAll = ref(false);
    window.onmessage = (event) => {
      if (event.source === window && event.data === "notificationPort") {
        const [port] = event.ports;
        window.notificationPort = port;
        port.onmessage = (event) => {
          console.log("from main process:", event.data);
          const {type, data} = event.data
          switch(type) {
            case "add":
            handleNotificationData(data);
            break;
            case "closeAll":
            handleCloseAll();
            break;
          }
        };
      }
    };
    const handleNotificationData = (data) => {
      const index = notificationArr.value.findIndex(v => v.tag === data.tag);
      index !== -1 && notificationArr.value.splice(index, 1);
      notificationArr.value.push(data)
      if (notificationArr.value.length > maxLen) {
         notificationArr.value.splice(0, 1)
      }
    }
    const handleCloseAll = () => {
      notificationArr.value = [];
    }
    const handleClose = (tag) => {
      const index = notificationArr.value.findIndex(v => v.tag === tag);
      notificationArr.value.splice(index, 1);
    }

    const setNotification = () => {
      const len = notificationArr.value.length;
      if (len > 0) {
        window.electronAPI.ipcInvoke("showNotification")
        window.electronAPI.ipcInvoke("heightNotification", len * 90 + (len === maxLen ? 20 : 0))
        showCloseAll.value = len === maxLen;
      } else {
        window.electronAPI.ipcInvoke("hideNotification")
      }
    }

    return {
      showCloseAll,
      notificationArr,
      handleCloseAll,
      handleClose,
      setNotification
    }
  }
}

const app = createApp(App);
app.mount('#app')