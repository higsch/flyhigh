<script>
  import { fade } from 'svelte/transition';

  import { timeFormat } from 'd3';

  import Fin from './Fin.svelte';

  export let data;
  
  const timeFormatter = timeFormat('%H:%M');
</script>

{#if data}
  <div class="wrapper" transition:fade="{{ duration: 200}}">
    <div class="info">
      <span>Flight</span>{data.flightId}<br />
      <span>Departure</span>{timeFormatter(data.departure)}<br />
      <span>Arrival</span>{timeFormatter(data.arrival)}<br />
      <span>Final price</span>{Math.round(data.endPrice)} €
    </div>
    <div class="fin">
      <Fin company={data.company} />
    </div>
  </div>
{/if}


<style>
  .wrapper {
    height: 40%;
    align-items: flex-end;
    justify-content: flex-end;
  }

  .info {
    margin: 0 calc(100 / 1vw) 0.5rem 0;
    font-size: 1rem;
    line-height: 1.5;
  }

  .info span {
    display: inline-block;
    width: 5.5rem;
    font-size: 0.8rem;
  }

  .fin {
    max-width: 50%;
  }
</style>
