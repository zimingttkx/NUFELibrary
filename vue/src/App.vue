<template>
  <div class="app">
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style lang="scss">
* {
  margin: 0px;
  padding: 0px;
}

html,
body,
.app {
  width: 100%;
  height: 100%;
}
</style>
