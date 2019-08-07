<script>
  import { fade, fly } from 'svelte/transition';

  import Fin from './Fin.svelte';

  export let data;
</script>

{#if data}
  <div class="wrapper" transition:fly="{{ x: 200, duration: 600}}">
    <div class="info"></div>
    <div class="fin">
      <Fin company={data.company}/>
    </div>
  </div>
{/if}

<style>
  .wrapper {
    justify-content: space-between;
  }

  .fin {
    width: 45%;
    height: 100%;
  }
</style>
