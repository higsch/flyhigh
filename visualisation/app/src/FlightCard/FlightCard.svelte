<script>
  import Fin from './Fin.svelte';
</script>

<div class="wrapper">
  <div class="info"></div>
  <div class="fin">
    <Fin />
  </div>
</div>

<style>
  .wrapper {
    justify-content: space-between;
  }

  .fin {
    width: 45%;
    height: 100%;
  }
</style>
