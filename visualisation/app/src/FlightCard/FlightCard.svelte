<script>
  import { fade } from 'svelte/transition';

  import Fin from './Fin.svelte';

  export let data;
</script>

{#if data}
  <div class="wrapper" transition:fade="{{ duration: 300}}">
    <div class="info"></div>
  </div>
{/if}

<!-- <div class="fin">
  <Fin company={data.company}/>
</div> -->

<style>
  .wrapper {
    justify-content: space-between;
  }

  .fin {
    width: 45%;
    height: 100%;
  }
</style>
